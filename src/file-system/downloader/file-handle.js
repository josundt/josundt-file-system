import { FileSystemFileHandleBase } from "../file-handle-base.js";
import { getWebStreamsTypeLibAsync } from "../lib/web-streams-ponyfill-factory.js";
import { FileSystemWritableFileStreamWrapper } from "../lib/writable-file-stream-wrapper.js";
import { RemoteWritableStream } from "./remote-writable-stream.js";
// @ts-expect-error accessing proprietary window properties
const isSafari = !!(/constructor/i.test(window.HTMLElement) || window.safari || window.WebKitPoint);
export class DownloadFileHandle extends FileSystemFileHandleBase {
    constructor(name = "Undefined") {
        super("file", name);
    }
    getFile() {
        throw new DOMException("A requested file or directory could not be found at the time an operation was processed.", "NotFoundError");
    }
    async createWritableInternal(options) {
        var _a;
        options !== null && options !== void 0 ? options : (options = {});
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { TransformStream, WritableStream } = await getWebStreamsTypeLibAsync();
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
        return new FileSystemWritableFileStreamWrapper(sink.getWriter());
    }
}
//# sourceMappingURL=file-handle.js.map