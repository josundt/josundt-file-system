import { FileSystemCreateWritableOptions, FileSystemFileHandleExt } from "../abstractions.js";
import { FileSystemFileHandleBase } from "../file-handle-base.js";
import { getWebStreamsTypeLibAsync } from "../lib/web-streams-ponyfill-factory.js";
import { ServiceWorkerDownloadInitMessage } from "./abstractions.js";
import { createMessagePortWritableStream } from "./message-port-writable-stream.js";

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
        const ts = new TransformStream();
        const tsWritable = ts.writable;

        if (!this.preferServiceWorker || !sw || !DownloadFileHandle.supportsServiceWorkerDownload()) {
            const link = document.createElement("a");

            let chunks: Blob[] = [];

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            ts.readable.pipeTo(new WritableStream<Uint8Array>({
                write: (chunk: Uint8Array) => {
                    chunks.push(new Blob([chunk]));
                },
                close: () => {
                    const blob = new Blob(
                        chunks
                        /*, { type: "application/octet-stream; charset=utf-8" }*/
                    );
                    chunks = [];

                    link.download = this.name;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
                }
            }));

        } else {
            const [writable, swMessagePort] = createMessagePortWritableStream(WritableStream);

            /* eslint-disable @typescript-eslint/naming-convention */
            const headers: Record<string, string> = {
                "content-disposition": `attachment; filename="${this.name}"`,
                //"content-type": "application/octet-stream",
                ...(options.size ? { "content-length": String(options.size) } : {})
            };

            const keepAlive = setInterval(() => sw.active!.postMessage("keepAlive"), 10_000);

            //let iframe: HTMLIFrameElement | undefined;
            const swInterceptUrl = `${sw.scope}${crypto.randomUUID()}/${encodeURIComponent(this.name)}`;

            ts.readable
                .pipeTo(writable)
                .finally(() => {
                    clearInterval(keepAlive);
                    // if (iframe) {
                    //     document.body.removeChild(iframe);
                    // }
                });

            // Transfer the stream to service worker
            const serviceWorkerStartMessage: ServiceWorkerDownloadInitMessage = {
                type: "download-init",
                url: swInterceptUrl,
                headers: headers,
                messagePort: swMessagePort
            };

            sw.active!.postMessage(serviceWorkerStartMessage, [swMessagePort]);

            // Use link click
            const link = document.createElement("a");
            link.href = swInterceptUrl;
            link.click();

            // Use iframe
            // // Trigger the download with a hidden iframe
            // iframe = document.createElement("iframe");
            // iframe.hidden = true;
            // iframe.src = interceptedUrl;
            // document.body.appendChild(iframe);
        }

        return tsWritable.getWriter();
    }

    static supportsServiceWorkerDownload(): boolean {
        // @ts-expect-error accessing proprietary window properties
        const isSafari = !!(/constructor/i.test(window.HTMLElement) || window.safari || window.WebKitPoint);
        /* ReadableStream required in service worker */
        return !isSafari && ("ReadableStream" in globalThis);

    }
}


