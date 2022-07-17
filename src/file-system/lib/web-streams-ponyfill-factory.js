/* eslint-disable @typescript-eslint/naming-convention */
let imported;
let getPonyFillsAsync;
export function setPonyFillDownloadCallback(fn) {
    getPonyFillsAsync = fn;
}
export async function getWebStreamsTypeLibAsync() {
    let result;
    if ("WritableStream" in globalThis && "TransformStream" in globalThis) {
        result = {
            WritableStream: globalThis.WritableStream,
            TransformStream: globalThis.TransformStream
        };
    }
    else {
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
//# sourceMappingURL=web-streams-ponyfill-factory.js.map