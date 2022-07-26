export enum MessagePortEventType {
    Write = 0,
    Pull = 1,
    Error = 2,
    Abort = 3,
    Close = 4
}

export interface MessagePortChunkMessage {
    type: number;
    chunk: Uint8Array;
    reason: any;
}

export interface MessagePortResponseMessage {
    url: string;
    headers: Record<string, string>;
    readablePort: MessagePort;
    rs?: ReadableStream;
}
