import { ServiceWorkerAbortRequest, ServiceWorkerCloseRequest, ServiceWorkerResponseMessage, ServiceWorkerWriteRequest } from "./abstractions.js";

export function createMessagePortWritableStream<W extends Uint8Array>(
    writableStreamType: typeof WritableStream
): [writableStream: WritableStream<W>, readablePort: MessagePort] {
    const channel = new MessageChannel();
    return [
        new writableStreamType<W>(new MessagePortWritableStreamSink<W>(channel.port2)),
        channel.port1
    ];
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
interface AsyncOperation<T = void> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
}

class MessagePortWritableStreamSink<W extends Uint8Array> implements UnderlyingSink<W> {
    constructor(port: MessagePort) {

        port.onmessage = (event: MessageEvent<ServiceWorkerResponseMessage>) => this.onServiceWorkerChannelResponse(event.data);

        this.outPort = port;
    }

    private readonly outPort: MessagePort;
    private controller?: WritableStreamDefaultController;

    private writeOperation: AsyncOperation | null = null;

    start(controller: WritableStreamDefaultController): Promise<any> {
        this.controller = controller;

        // Apply initial backpressure
        return Promise.resolve(); // JOSUNDT: BUGFIX
    }

    write(chunk: W, controller: WritableStreamDefaultController): void | PromiseLike<void> {
        const message: ServiceWorkerWriteRequest = {
            instruction: "write",
            chunk: chunk
        };

        // Send chunk
        this.outPort.postMessage(message, [chunk.buffer]);

        // Assume backpressure after every write, until sender pulls
        return this.startWriteOperation();
    }

    close(): void {
        const message: ServiceWorkerCloseRequest = {
            instruction: "close"
        };
        this.outPort.postMessage(message);
        this.outPort.close();
    }

    abort(reason: string): void {
        const message: ServiceWorkerAbortRequest = {
            instruction: "abort",
            reason: reason
        };
        this.outPort.postMessage(message);
        this.outPort.close();
    }

    private onServiceWorkerChannelResponse(message: ServiceWorkerResponseMessage): void {
        if (message.instruction === "pull") {
            this.finalizeWriteOperation();
        }
        if (message.instruction === "error") {
            this.handleError(message.reason);
        }
    }

    private handleError(reason: string): void {
        this.controller!.error(reason);
        this.rejectWriteOperation(reason);
        this.outPort.close();
    }

    private startWriteOperation(): Promise<void> {
        let res: () => void;
        let rej: (err: any) => void;
        const writePromise = new Promise<void>((resolve, reject) => {
            res = resolve;
            rej = reject;
        });
        this.writeOperation = {
            promise: writePromise,
            resolve: res!,
            reject: rej!
        };
        return writePromise;
    }

    private finalizeWriteOperation(): void {
        this.writeOperation?.resolve();
        this.writeOperation = null;
    }

    private rejectWriteOperation(reason: string): void {
        // const writePromise = this.writePromise?.promise ?? this.initWritePromise();
        // this.writePromise!.catch(() => {
        //     // Unhandled
        // });
        this.writeOperation?.reject!(reason);
        this.writeOperation = null;
    }
}
