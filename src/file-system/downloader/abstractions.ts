
export interface ServiceWorkerDownloadInitMessage {
    type: "download-init";
    url: string;
    headers: Record<string, string>;
    messagePort: MessagePort;
}

export type ChannelRequestInstruction = "write" | "abort" | "close";

export interface ChannelRequestBase {
    instruction: ChannelRequestInstruction;
}

export interface ChannelWriteRequest extends ChannelRequestBase {
    instruction: "write";
    chunk: Uint8Array;
}

export interface ChannelAbortRequest extends ChannelRequestBase {
    instruction: "abort";
    reason: string;
}

export interface ChannelCloseRequest extends ChannelRequestBase {
    instruction: "close";
}

export type ChannelRequestMessage = ChannelWriteRequest | ChannelAbortRequest | ChannelCloseRequest;


export type ChannelResponseResult = "success" | "error";

export interface ChannelResponseBase {
    result: ChannelResponseResult;
}

export interface ChannelSuccessResponse extends ChannelResponseBase {
    result: "success";
}

export interface ChannelErrorResponse extends ChannelResponseBase {
    result: "error";
    reason: string;
}

export type ChannelResponseMessage = ChannelSuccessResponse  | ChannelErrorResponse;
