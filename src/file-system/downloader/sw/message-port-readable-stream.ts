import { ServiceWorkerErrorResponse, ServiceWorkerPullResponse, ServiceWorkerRequestMessage } from "../abstractions.js";

export function createMessagePortReadableStream<R extends Uint8Array>(
    readablePort: MessagePort,
    readableStreamType: typeof ReadableStream
): ReadableStream<R> {
    return new readableStreamType<R>(
        new MessagePortReadableStreamSource(readablePort),
        new CountQueuingStrategy({ highWaterMark: 4 })
    );
}


class MessagePortReadableStreamSource implements UnderlyingSource {

    constructor(
        private readonly port: MessagePort
    ) {
        this.port.onmessage = (evt: MessageEvent<ServiceWorkerRequestMessage>) => this.onMessage(evt.data);
    }

    private controller?: ReadableStreamController<any>;

    start(controller: ReadableStreamController<any>): void {
        this.controller = controller;
    }

    cancel(reason: Error): void {
        // Firefox can notify a cancel event, chrome can't
        // https://bugs.chromium.org/p/chromium/issues/detail?id=638494
        const message: ServiceWorkerErrorResponse = {
            instruction: "error",
            reason: reason.message
        };
        this.port.postMessage(message);
        this.port.close();
    }

    onMessage(request: ServiceWorkerRequestMessage): void {
        // enqueue() will call pull() if needed when there's no backpressure
        if (request.instruction === "write") {
            this.controller!.enqueue(request.chunk);
            const response: ServiceWorkerPullResponse = {
                instruction: "pull"
            };
            this.port.postMessage(response);
        }
        if (request.instruction === "abort") {
            this.controller!.error(request.reason);
            this.port.close();
        }
        if (request.instruction === "close") {
            this.controller!.close();
            this.port.close();
        }
    }
}
