/* eslint-disable @typescript-eslint/naming-convention */

export interface StreamsApi {
    ByteLengthQueuingStrategy: typeof ByteLengthQueuingStrategy;
    CountQueuingStrategy: typeof CountQueuingStrategy;
    ReadableByteStreamController: any; // typeof ReadableByteStreamController;
    ReadableStream: typeof ReadableStream;
    ReadableStreamBYOBReader: any; //typeof ReadableStreamBYOBReader;
    ReadableStreamBYOBRequest: any; //typeof ReadableStreamBYOBRequest;
    ReadableStreamDefaultController: typeof ReadableStreamDefaultController;
    ReadableStreamDefaultReader: typeof ReadableStreamDefaultReader;
    TransformStream: typeof TransformStream;
    TransformStreamDefaultController: typeof TransformStreamDefaultController;
    WritableStream: typeof WritableStream;
    WritableStreamDefaultController: typeof WritableStreamDefaultController;
}

export interface StreamsApiDependencies extends Partial<StreamsApi> {
    ReadableStream: typeof ReadableStream;
    TransformStream: typeof TransformStream;
    WritableStream: typeof WritableStream;
}

let imported: StreamsApiDependencies | undefined;

let getStreamsApiPonyFillsAsync: (() => Promise<StreamsApiDependencies>) | undefined;
let forcePonyFill: boolean = false;

export function setPonyFillDownloadCallback(fn: () => Promise<StreamsApiDependencies>, preferPonyFill: boolean = false): void {
    getStreamsApiPonyFillsAsync = fn;
    forcePonyFill = preferPonyFill;
}

export async function getStreamsApiDepsAsync(): Promise<StreamsApiDependencies> {

    let result: StreamsApiDependencies;

    if (!forcePonyFill && "ReadableStream" in globalThis && "TransformStream" in globalThis && "WritableStream" in globalThis) {
        result = {
            ReadableStream: globalThis.ReadableStream,
            TransformStream: globalThis.TransformStream,
            WritableStream: globalThis.WritableStream
        };
    } else {
        if (!getStreamsApiPonyFillsAsync) {
            throw new Error("Callback to download ponyfills has not been set! Please set it using the 'setPonyFillDownloadCallback' function");
        }
        if (!imported) {
            imported = await getStreamsApiPonyFillsAsync();
        }
        result = {
            ReadableStream: imported.ReadableStream,
            TransformStream: imported.TransformStream,
            WritableStream: imported.WritableStream
        };
    }

    return result;
}
