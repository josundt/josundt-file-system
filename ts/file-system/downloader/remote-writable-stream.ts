import { MessagePortSink } from "./message-port-sink.js";

export class RemoteWritableStream<W extends Uint8Array> {
    constructor(writableStream: typeof WritableStream) {
        const channel = new MessageChannel();
        this.readablePort = channel.port1;
        this.writable = new writableStream<W>(
            new MessagePortSink<W>(channel.port2)
        );
    }

    readonly readablePort: MessagePort;
    readonly writable: WritableStream<W>;
}
