import { FileSystemCreateWritableOptions, FileSystemFileHandleExt } from "../abstractions.js";
import { FileSystemFileHandleBase } from "../file-handle-base.js";
import { getWebStreamsTypeLibAsync } from "../lib/web-streams-ponyfill-factory.js";
import { MessagePortResponseMessage } from "./abstractions.js";
import { RemoteWritableStream } from "./remote-writable-stream.js";

// @ts-expect-error accessing proprietary window properties
const isSafari = !!(/constructor/i.test(window.HTMLElement) || window.safari || window.WebKitPoint);

export interface DownloadFileHandleOptions {
    filename?: string;
    preferServiceWorker?: boolean;
}

export class DownloadFileHandle
    extends FileSystemFileHandleBase
    implements FileSystemFileHandleExt {

    constructor(options: DownloadFileHandleOptions = {}) {
        super("file", options.filename ?? "Undefined");
        this.preferServiceWorker = !!options.preferServiceWorker;
    }

    private readonly preferServiceWorker: boolean = false;

    getFile(): Promise<File> {
        throw new DOMException(
            "A requested file or directory could not be found at the time an operation was processed.",
            "NotFoundError"
        );
    }

    protected async createWritableInternal<W>(options?: FileSystemCreateWritableOptions): Promise<WritableStreamDefaultWriter> {
        options ??= {};

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { TransformStream, WritableStream } = await getWebStreamsTypeLibAsync();

        const sw = await navigator.serviceWorker?.getRegistration();
        const link = document.createElement("a");
        const ts = new TransformStream();
        const sink = ts.writable;

        link.download = this.name;

        if (!this.preferServiceWorker || isSafari || !sw) {
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
            const headers: Record<string, string> = {
                "content-disposition": `attachment; filename="${fileName}"`,
                //"content-type": "application/octet-stream",
                ...(options.size ? { "content-length": String(options.size) } : {})
            };

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const keepAlive = setTimeout(() => sw.active!.postMessage(0), 1_000);

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
                .pipeTo(writable)
                .finally(() => {
                    clearInterval(keepAlive);
                });

            const interceptedFileName = `${sw.scope}${crypto.randomUUID()}/${fileName}`;

            // Transfer the stream to service worker
            const responseMessage: MessagePortResponseMessage = {
                url: interceptedFileName,
                headers: headers,
                readablePort: readablePort
            };

            sw.active!.postMessage(responseMessage, [readablePort]);

            // Trigger the download with a hidden iframe
            const iframe = document.createElement("iframe");
            iframe.hidden = true;
            iframe.src = interceptedFileName;
            document.body.appendChild(iframe);
            // window.open(sw.scope + fileName, "_blank");
        }

        return sink.getWriter();
    }
}


