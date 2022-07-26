import { DownloadFileHandle } from "@josundt/file-system/downloader";

export async function downloadAsync(
    url: string,
    getResponseAsync: (url: string) => Promise<Response>,
    preferServiceWorker: boolean,
    filename?: string,
): Promise<void> {
    const fileHandle = new DownloadFileHandle({
        preferServiceWorker: preferServiceWorker,
        filename: filename
    });
    const response = await getResponseAsync(url);
    const writableStream = await fileHandle.createWritable();
    await response.body!.pipeTo(writableStream);
}
