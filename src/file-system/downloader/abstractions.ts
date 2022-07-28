export type ServiceWorkerRequestInstruction = "start" | "write" | "abort" | "close";

export type ServiceWorkerResponseInstruction = "pull" | "error";

export interface ServiceWorkerMessageBase<TInstruction> {
    instruction: TInstruction;
}

export interface ServiceWorkerStartRequest extends ServiceWorkerMessageBase<ServiceWorkerRequestInstruction> {
    instruction: "start";
    url: string;
    headers: Record<string, string>;
    readablePort: MessagePort;
    rs?: ReadableStream; // Property added by service worker
}

export interface ServiceWorkerWriteRequest extends ServiceWorkerMessageBase<ServiceWorkerRequestInstruction> {
    instruction: "write";
    chunk: Uint8Array;
}

export interface ServiceWorkerAbortRequest extends ServiceWorkerMessageBase<ServiceWorkerRequestInstruction> {
    instruction: "abort";
    reason: string;
}

export interface ServiceWorkerCloseRequest extends ServiceWorkerMessageBase<ServiceWorkerRequestInstruction> {
    instruction: "close";
}

export type ServiceWorkerRequestMessage = ServiceWorkerWriteRequest | ServiceWorkerAbortRequest | ServiceWorkerCloseRequest;


export interface ServiceWorkerPullResponse extends ServiceWorkerMessageBase<ServiceWorkerResponseInstruction> {
    instruction: "pull";
}

export interface ServiceWorkerErrorResponse extends ServiceWorkerMessageBase<ServiceWorkerResponseInstruction> {
    instruction: "error";
    reason: string;
}

export type ServiceWorkerResponseMessage = ServiceWorkerPullResponse  | ServiceWorkerErrorResponse;
