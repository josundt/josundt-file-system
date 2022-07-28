import { ServiceWorkerStartRequest } from "../abstractions.js";
import { createMessagePortReadableStream } from "./message-port-readable-stream.js";

interface RequestInterceptionInfo {
    readableStream: ReadableStream<Uint8Array>;
    headers: Record<string, string>;
}

interface MessageEvent {  // Need to add interface since service worker lib is not in tsconfig
    data: any;
}

interface FetchEvent { // Need to add interface since service worker lib is not in tsconfig
    request: Request;
    respondWith(response: Response): void;
}

const interceptionMap = new Map<string, RequestInterceptionInfo>();

export function handleDownloadMessageEvent(ev: MessageEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = ev.data;
    if (isStartMessage(data)) {
        const readableStream = createMessagePortReadableStream(
            data.readablePort,
            ReadableStream // todo : use ponyFill
        );

        interceptionMap.set(data.url, {
            readableStream: readableStream,
            headers: data.headers ?? {}
        });
    }

}

export function handleDownloadFetchEvent(ev: FetchEvent): void {
    const url = ev.request.url;
    const interceptInfo = interceptionMap.get(url);
    if (!interceptInfo) {
        return;
    }
    interceptionMap.delete(url);
    ev.respondWith(new Response(interceptInfo.readableStream, {
        headers: interceptInfo.headers
    }));
}

function isStartMessage(data: any): data is ServiceWorkerStartRequest {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return !!(data?.instruction === "start" && data.url && data.readablePort);
}
