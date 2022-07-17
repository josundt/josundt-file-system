import { MessagePortSink } from "./message-port-sink.js";
export class RemoteWritableStream {
    constructor(writableStream) {
        const channel = new MessageChannel();
        this.readablePort = channel.port1;
        this.writable = new writableStream(new MessagePortSink(channel.port2));
    }
}
//# sourceMappingURL=remote-writable-stream.js.map