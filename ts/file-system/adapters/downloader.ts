import { FileSystemCreateWritableOptions, FileSystemFileHandleExtended, FileSystemHandleRemoveArgs } from "../handle-poly.js";
import FileSystemWritableFileStream from "../writable-file-stream.js";

// @ts-expect-error accessing proprietary window properties
const isSafari = !!(/constructor/i.test(window.HTMLElement) || window.safari || window.WebKitPoint);

/* eslint-disable @typescript-eslint/naming-convention */
const TransformStream = globalThis.TransformStream;
const WritableStream = globalThis.WritableStream;
/* eslint-enable @typescript-eslint/naming-convention */

export class FileSystemDownloadFileHandle implements FileSystemFileHandleExtended {

    constructor(name: string = "unkown") {
        this.name = name;
        this.kind = "file";
    }

    readonly name: string;
    readonly kind: "file";

    getFile(): Promise<File> {
        throw new DOMException(
            "A requested file or directory could not be found at the time an operation was processed.",
            "NotFoundError"
        );
    }

    remove(args: FileSystemHandleRemoveArgs): Promise<void> {
        return Promise.resolve();
    }

    isSameEntry(other: FileSystemFileHandleExtended): Promise<boolean> {
        return Promise.resolve(this === other);
    }

    async createWritable<W>(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream> {
        options ??= {};

        // if (!TransformStream) {
        //     // @ts-ignore
        //     const ponyfill = await import("https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs")
        //     TransformStream = ponyfill.TransformStream
        //     WritableStream = ponyfill.WritableStream
        // }

        const sw = await navigator.serviceWorker?.getRegistration();
        const link = document.createElement("a");
        const ts = new TransformStream();
        const sink = ts.writable;

        link.download = this.name;

        if (isSafari || !sw) {
            let chunks: Blob[] = [];

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            ts.readable.pipeTo(new WritableStream<Uint8Array>({
                write: (chunk: Uint8Array) => {
                    chunks.push(new Blob([chunk]));
                },
                close: () => {
                    const blob = new Blob(chunks, { type: "application/octet-stream; charset=utf-8" });
                    chunks = [];
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
                }
            }));

        } else {
            const { writable, readablePort } = new RemoteWritableStream(WritableStream);

            // Make filename RFC5987 compatible
            const fileName = encodeURIComponent(this.name).replace(/['()]/g, encodeURIComponent).replace(/\*/g, "%2A");
            /* eslint-disable @typescript-eslint/naming-convention */
            const headers = {
                "content-disposition": `attachment; filename*=UTF-8''${fileName}`,
                "content-type": "application/octet-stream; charset=utf-8",
                ...(options.size ? { "content-length": options.size } : {})
            };
            /* eslint-enable @typescript-eslint/naming-convention */

            const keepAlive = setTimeout(() => sw.active?.postMessage(0), 10000);

            ts.readable
                .pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
                    transform: (chunk: Uint8Array, ctrl: TransformStreamDefaultController<Uint8Array>) => {
                        if (chunk instanceof Uint8Array) {
                            ctrl.enqueue(chunk);
                        }
                        const reader = new Response(chunk).body!.getReader();
                        const pump = async (arg?: Uint8Array): Promise<void> => {
                            const e = await reader.read();
                            if (!e.done) {
                                ctrl.enqueue(e.value);
                                await pump();
                            }
                        };
                        return pump();
                    }
                }))
                .pipeTo(writable).finally(() => {
                    clearInterval(keepAlive);
                });

            // Transfer the stream to service worker
            sw.active!.postMessage({
                url: sw.scope + fileName,
                headers: headers,
                readablePort: readablePort
            }, [readablePort]);

            // Trigger the download with a hidden iframe
            const iframe = document.createElement("iframe");
            iframe.hidden = true;
            iframe.src = sw.scope + fileName;
            document.body.appendChild(iframe);
        }

        // TODO: IS THIS CAST OK OR SHOULD THE METHOD RETURN THE VALUE FROM LIB.D.TS?
        return sink.getWriter() as unknown as FileSystemWritableFileStream;
    }
}

enum MessageEventType {
    Write = 0,
    Pull = 1,
    Error = 2,
    Abort = 3,
    Close = 4
}

interface MessageEventData {
    type: number;
    reason: string;
}

class MessagePortSink<W extends Uint8Array> implements UnderlyingSink<W> {
    constructor(port: MessagePort) {

        port.onmessage = (event: MessageEvent<MessageEventData>) => this._onMessage(event.data);

        this._port = port;
        this._resetReady();
    }

    private readonly _port: MessagePort;
    private _controller?: WritableStreamDefaultController;
    private _readyPending: boolean = false;
    private _readyPromise?: Promise<void>;
    private _readyResolve?: () => void;
    private _readyReject?: (reason: MessageEventData["reason"]) => void;

    start(controller: WritableStreamDefaultController): any {
        this._controller = controller;
        // Apply initial backpressure
        return this._readyPromise;
    }

    write(chunk: W, controller: WritableStreamDefaultController): void | PromiseLike<void> {
        const message = { type: MessageEventType.Write, chunk: chunk };

        // Send chunk
        this._port.postMessage(message, [chunk.buffer]);

        // Assume backpressure after every write, until sender pulls
        this._resetReady();

        // Apply backpressure
        return this._readyPromise;
    }

    close(): void {
        this._port.postMessage({ type: MessageEventType.Close });
        this._port.close();
    }

    abort(reason: MessageEventData["reason"]): void {
        this._port.postMessage({ type: MessageEventType.Abort, reason: reason });
        this._port.close();
    }

    private _onMessage(message: MessageEventData): void {
        if (message.type === MessageEventType.Pull || message.type === MessageEventType.Write) {
            this._resolveReady();
        }
        if (message.type === MessageEventType.Error || message.type === MessageEventType.Abort) {
            this._onError(message.reason);
        }
    }

    private _onError(reason: MessageEventData["reason"]): void {
        this._controller!.error(reason);
        this._rejectReady(reason);
        this._port.close();
    }

    private _resetReady(): void {
        this._readyPromise = new Promise((resolve, reject) => {
            this._readyResolve = resolve;
            this._readyReject = reject;
        });
        this._readyPending = true;
    }

    private _resolveReady(): void {
        this._readyResolve!();
        this._readyPending = false;
    }

    private _rejectReady(reason: MessageEventData["reason"]): void {
        if (!this._readyPending) {
            this._resetReady();
        }
        this._readyPromise!.catch(() => {
            // Unhandled
        });
        this._readyReject!(reason);
        this._readyPending = false;
    }
}

class RemoteWritableStream<W extends Uint8Array> {
    constructor(writableStream: typeof WritableStream) {
        const channel = new MessageChannel();
        this.readablePort = channel.port1;
        this.writable = new writableStream<W>(
            new MessagePortSink<W>(channel.port2)
        );
    }

    readonly readablePort: MessagePort;
    readonly writable: WritableStream<W>;
}
