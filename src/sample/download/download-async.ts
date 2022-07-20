import { DownloadFileHandle } from "@josundt/file-system/downloader";

export async function downloadAsync(
    url: string,
    getResponseAsync: (url: string) => Promise<Response>,
    fileName?: string
): Promise<void> {
    const fileHandle = new DownloadFileHandle(fileName);
    const response = await getResponseAsync(url);
    const writableStream = await fileHandle.createWritable();
    await response.body!.pipeTo(writableStream);
}
