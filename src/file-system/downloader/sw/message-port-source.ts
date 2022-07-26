import { MessagePortChunkMessage, MessagePortEventType } from "../abstractions.js";

export class MessagePortSource implements UnderlyingSource {

    private controller?: ReadableStreamController<any>;

    constructor(
        private readonly port: MessagePort
    ) {
        this.port.onmessage = (evt: MessageEvent<MessagePortChunkMessage>) => this.onMessage(evt.data);
    }

    start(controller: ReadableStreamController<any>): void {
        this.controller = controller;
    }

    cancel(reason: Error): void {
        // Firefox can notify a cancel event, chrome can't
        // https://bugs.chromium.org/p/chromium/issues/detail?id=638494
        this.port.postMessage({ type: MessagePortEventType.Error, reason: reason.message });
        this.port.close();
    }

    onMessage(message: { type: number; chunk: Uint8Array; reason: any; }): void {
        // enqueue() will call pull() if needed when there's no backpressure
        if (message.type === MessagePortEventType.Write) {
            this.controller!.enqueue(message.chunk);
            this.port.postMessage({ type: MessagePortEventType.Pull });
        }
        if (message.type === MessagePortEventType.Abort) {
            this.controller!.error(message.reason);
            this.port.close();
        }
        if (message.type === MessagePortEventType.Close) {
            this.controller!.close();
            this.port.close();
        }
    }
}
