import { ChannelAbortRequest, ChannelCloseRequest, ChannelResponseMessage, ChannelWriteRequest } from "./abstractions.js";

export function createMessagePortWritableStream<W extends Uint8Array>(
    writableStreamType: typeof WritableStream
): [writableStream: WritableStream<W>, readablePort: MessagePort] {
    const channel = new MessageChannel();
    return [
        new writableStreamType<W>(new MessagePortWritableStreamSink<W>(channel.port2)),
        channel.port1
    ];
}

class MessagePortWritableStreamSink<W extends Uint8Array> implements UnderlyingSink<W> {
    constructor(port: MessagePort) {
        this.port = port;
    }

    private readonly port: MessagePort;

    start(controller: WritableStreamDefaultController): Promise<any> {
        this.port.start();
        return Promise.resolve();
    }

    write(chunk: W, controller: WritableStreamDefaultController): void | PromiseLike<void> {

        const promise = new Promise<void>((resolve, reject) => {

            const onServiceWorkerChannelResponse: (inMessage: MessageEvent<ChannelResponseMessage>) => void = m => {
                if (m.data.result === "success") {
                    resolve();
                } else {
                    controller!.error(m.data.reason);
                    this.port.close();
                    reject(new Error(m.data.reason));
                }
            };

            // this.port.onmessage ??= onServiceWorkerChannelResponse;
            this.port.addEventListener("message", onServiceWorkerChannelResponse, { once: true });

            const outMessage: ChannelWriteRequest = {
                instruction: "write",
                chunk: chunk
            };

            // Send chunk
            this.port.postMessage(outMessage, [chunk.buffer]);

        });

        return this.timeout(
            10_000,
            "Downloader: Response from service worker message channeel timed out",
            promise
        );

    }

    close(): void {
        const message: ChannelCloseRequest = {
            instruction: "close"
        };
        this.port.postMessage(message);
        this.port.close();
    }

    abort(reason: string): void {
        const message: ChannelAbortRequest = {
            instruction: "abort",
            reason: reason
        };
        this.port.postMessage(message);
        this.port.close();
    }

    private timeout<T>(timeoutMs: number, timeoutError: string, promise: Promise<T>): Promise<T> {
        return Promise.race([
            new Promise<T>((resolve, reject) => setTimeout(() => reject(new Error(timeoutError)), timeoutMs)),
            promise
        ]);
    }
}
