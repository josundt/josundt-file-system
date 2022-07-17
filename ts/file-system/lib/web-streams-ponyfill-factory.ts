/* eslint-disable @typescript-eslint/naming-convention */

export interface WebStreamsTypeLib {
    TransformStream: typeof TransformStream;
    WritableStream: typeof WritableStream;
}


let imported: WebStreamsTypeLib | undefined;

let getPonyFillsAsync: (() => Promise<WebStreamsTypeLib>) | undefined;

export function setPonyFillDownloadCallback(fn: () => Promise<WebStreamsTypeLib>): void {
    getPonyFillsAsync = fn;
}


export async function getWebStreamsTypeLibAsync(): Promise<WebStreamsTypeLib> {

    let result: WebStreamsTypeLib;

    if ("WritableStream" in globalThis && "TransformStream" in globalThis) {
        result = {
            WritableStream: globalThis.WritableStream,
            TransformStream: globalThis.TransformStream
        };
    } else {
        if (!getPonyFillsAsync) {
            throw new Error("Callback to download ponyfills has not been set! Please set it using the 'setPonyFillDownloadCallback' function");
        }
        if (!imported) {
            imported = await getPonyFillsAsync();
        }
        result = {
            WritableStream: /*globalThis.WritableStream ??*/ imported.WritableStream,
            TransformStream: /*globalThis.TransformStream ??*/ imported.TransformStream
        };
    }

    return result;
}
