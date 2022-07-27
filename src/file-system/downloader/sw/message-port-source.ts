import { MessagePortChunkMessageData, MessagePortEventType } from "../abstractions.js";

export class MessagePortSource implements UnderlyingSource {

    constructor(
        private readonly port: MessagePort
    ) {
        this.port.onmessage = (evt: MessageEvent<MessagePortChunkMessageData>) => this.onMessage(evt.data);
    }

    private controller?: ReadableStreamController<any>;

    start(controller: ReadableStreamController<any>): void {
        this.controller = controller;
    }

    cancel(reason: Error): void {
        // Firefox can notify a cancel event, chrome can't
        // https://bugs.chromium.org/p/chromium/issues/detail?id=638494
        this.port.postMessage({ type: MessagePortEventType.Error, reason: reason.message });
        this.port.close();
    }

    onMessage(message: MessagePortChunkMessageData): void {
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
