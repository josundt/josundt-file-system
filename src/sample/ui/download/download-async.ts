import { DownloadFileHandle } from "@josundt/file-system/downloader";

export async function downloadAsync(
    url: string,
    getResponseAsync: (url: string) => Promise<Response>,
    preferServiceWorker: boolean,
    filename?: string,
): Promise<void> {
    const response = await getResponseAsync(url);
    const fileHandle = new DownloadFileHandle({
        filename: filename,
        preferServiceWorker: preferServiceWorker,
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
    });
    const writableStream = await fileHandle.createWritable();
    await response.body!.pipeTo(writableStream);
}
