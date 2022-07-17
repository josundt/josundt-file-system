// @ts-expect-error accessing proprietary window properties
const isSafari = !!(/constructor/i.test(window.HTMLElement) || window.safari || window.WebKitPoint);
/* eslint-disable @typescript-eslint/naming-convention */
const TransformStream = globalThis.TransformStream;
const WritableStream = globalThis.WritableStream;
/* eslint-enable @typescript-eslint/naming-convention */
export class FileSystemDownloadFileHandle {
    constructor(name = "unkown") {
        this.name = name;
        this.kind = "file";
    }
    getFile() {
        throw new DOMException("A requested file or directory could not be found at the time an operation was processed.", "NotFoundError");
    }
    remove(args) {
        return Promise.resolve();
    }
    isSameEntry(other) {
        return Promise.resolve(this === other);
    }
    async createWritable(options) {
        var _a;
        options !== null && options !== void 0 ? options : (options = {});
        // if (!TransformStream) {
        //     // @ts-ignore
        //     const ponyfill = await import("https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs")
        //     TransformStream = ponyfill.TransformStream
        //     WritableStream = ponyfill.WritableStream
        // }
        const sw = await ((_a = navigator.serviceWorker) === null || _a === void 0 ? void 0 : _a.getRegistration());
        const link = document.createElement("a");
        const ts = new TransformStream();
        const sink = ts.writable;
        link.download = this.name;
        if (isSafari || !sw) {
            let chunks = [];
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            ts.readable.pipeTo(new WritableStream({
                write: (chunk) => {
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
        }
        else {
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
            const keepAlive = setTimeout(() => { var _a; return (_a = sw.active) === null || _a === void 0 ? void 0 : _a.postMessage(0); }, 10000);
            ts.readable
                .pipeThrough(new TransformStream({
                transform: (chunk, ctrl) => {
                    if (chunk instanceof Uint8Array) {
                        ctrl.enqueue(chunk);
                    }
                    const reader = new Response(chunk).body.getReader();
                    const pump = async (arg) => {
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
            sw.active.postMessage({
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
        return sink.getWriter();
    }
}
var MessageEventType;
(function (MessageEventType) {
    MessageEventType[MessageEventType["Write"] = 0] = "Write";
    MessageEventType[MessageEventType["Pull"] = 1] = "Pull";
    MessageEventType[MessageEventType["Error"] = 2] = "Error";
    MessageEventType[MessageEventType["Abort"] = 3] = "Abort";
    MessageEventType[MessageEventType["Close"] = 4] = "Close";
})(MessageEventType || (MessageEventType = {}));
class MessagePortSink {
    constructor(port) {
        this._readyPending = false;
        port.onmessage = (event) => this._onMessage(event.data);
        this._port = port;
        this._resetReady();
    }
    start(controller) {
        this._controller = controller;
        // Apply initial backpressure
        return this._readyPromise;
    }
    write(chunk, controller) {
        const message = { type: MessageEventType.Write, chunk: chunk };
        // Send chunk
        this._port.postMessage(message, [chunk.buffer]);
        // Assume backpressure after every write, until sender pulls
        this._resetReady();
        // Apply backpressure
        return this._readyPromise;
    }
    close() {
        this._port.postMessage({ type: MessageEventType.Close });
        this._port.close();
    }
    abort(reason) {
        this._port.postMessage({ type: MessageEventType.Abort, reason: reason });
        this._port.close();
    }
    _onMessage(message) {
        if (message.type === MessageEventType.Pull || message.type === MessageEventType.Write) {
            this._resolveReady();
        }
        if (message.type === MessageEventType.Error || message.type === MessageEventType.Abort) {
            this._onError(message.reason);
        }
    }
    _onError(reason) {
        this._controller.error(reason);
        this._rejectReady(reason);
        this._port.close();
    }
    _resetReady() {
        this._readyPromise = new Promise((resolve, reject) => {
            this._readyResolve = resolve;
            this._readyReject = reject;
        });
        this._readyPending = true;
    }
    _resolveReady() {
        this._readyResolve();
        this._readyPending = false;
    }
    _rejectReady(reason) {
        if (!this._readyPending) {
            this._resetReady();
        }
        this._readyPromise.catch(() => {
            // Unhandled
        });
        this._readyReject(reason);
        this._readyPending = false;
    }
}
class RemoteWritableStream {
    constructor(writableStream) {
        const channel = new MessageChannel();
        this.readablePort = channel.port1;
        this.writable = new writableStream(new MessagePortSink(channel.port2));
    }
}
//# sourceMappingURL=downloader.js.map