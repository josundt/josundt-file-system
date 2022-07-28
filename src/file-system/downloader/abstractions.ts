
// This message is not
export interface ServiceWorkerStartMessage {
    type: "downloadStart";
    url: string;
    headers: Record<string, string>;
    readablePort: MessagePort;
    rs?: ReadableStream; // Property added by service worker
}

export type ServiceWorkerRequestInstruction = "write" | "abort" | "close";

export type ServiceWorkerResponseInstruction = "pull" | "error";

export interface ServiceWorkerChannelMessageBase<TInstruction> {
    instruction: TInstruction;
}

export interface ServiceWorkerWriteRequest extends ServiceWorkerChannelMessageBase<ServiceWorkerRequestInstruction> {
    instruction: "write";
    chunk: Uint8Array;
}

export interface ServiceWorkerAbortRequest extends ServiceWorkerChannelMessageBase<ServiceWorkerRequestInstruction> {
    instruction: "abort";
    reason: string;
}

export interface ServiceWorkerCloseRequest extends ServiceWorkerChannelMessageBase<ServiceWorkerRequestInstruction> {
    instruction: "close";
}

export type ServiceWorkerRequestMessage = ServiceWorkerWriteRequest | ServiceWorkerAbortRequest | ServiceWorkerCloseRequest;


export interface ServiceWorkerPullResponse extends ServiceWorkerChannelMessageBase<ServiceWorkerResponseInstruction> {
    instruction: "pull";
}

export interface ServiceWorkerErrorResponse extends ServiceWorkerChannelMessageBase<ServiceWorkerResponseInstruction> {
    instruction: "error";
    reason: string;
}

export type ServiceWorkerResponseMessage = ServiceWorkerPullResponse  | ServiceWorkerErrorResponse;
