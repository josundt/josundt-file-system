export enum MessagePortEventType {
    Write = "write",
    Pull = "pull",
    Error = "error",
    Abort = "abort",
    Close = "close"
}

export interface MessagePortChunkMessageData {
    type: MessagePortEventType;
    chunk: Uint8Array;
    reason: any;
}

export interface MessagePortResponseMessageData {
    url: string;
    headers: Record<string, string>;
    readablePort: MessagePort;
    rs?: ReadableStream;
}
