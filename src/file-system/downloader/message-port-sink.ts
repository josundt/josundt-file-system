import { MessagePortEventType } from "./abstractions.js";

interface MessagePortSinkEventData {
    type: MessagePortEventType;
    reason: string;
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
interface AsyncOperation<T = void> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
}

export class MessagePortSink<W extends Uint8Array> implements UnderlyingSink<W> {
    constructor(port: MessagePort) {

        port.onmessage = (event: MessageEvent<MessagePortSinkEventData>) => this.onSwReply(event.data);

        this.outPort = port;
    }

    private readonly outPort: MessagePort;
    private controller?: WritableStreamDefaultController;

    private writeOperation: AsyncOperation | null = null;

    start(controller: WritableStreamDefaultController): Promise<any> {
        this.controller = controller;

        // Apply initial backpressure
        return Promise.resolve(); // JOSUNDT: BUGFIX

        // return this._readyPromise;
    }

    write(chunk: W, controller: WritableStreamDefaultController): void | PromiseLike<void> {
        const message = { type: MessagePortEventType.Write, chunk: chunk };

        // Send chunk
        this.outPort.postMessage(message, [chunk.buffer]);

        // Assume backpressure after every write, until sender pulls
        return this.startWriteOperation();
    }

    close(): void {
        this.outPort.postMessage({ type: MessagePortEventType.Close });
        this.outPort.close();
    }

    abort(reason: MessagePortSinkEventData["reason"]): void {
        this.outPort.postMessage({ type: MessagePortEventType.Abort, reason: reason });
        this.outPort.close();
    }

    private onSwReply(message: MessagePortSinkEventData): void {
        if (message.type === MessagePortEventType.Pull || message.type === MessagePortEventType.Write) {
            this.finalizeWriteOperation();
        }
        if (message.type === MessagePortEventType.Error || message.type === MessagePortEventType.Abort) {
            this.handleError(message.reason);
        }
    }

    private handleError(reason: MessagePortSinkEventData["reason"]): void {
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

    private rejectWriteOperation(reason: MessagePortSinkEventData["reason"]): void {
        // const writePromise = this.writePromise?.promise ?? this.initWritePromise();
        // this.writePromise!.catch(() => {
        //     // Unhandled
        // });
        this.writeOperation?.reject!(reason);
        this.writeOperation = null;
    }
}
