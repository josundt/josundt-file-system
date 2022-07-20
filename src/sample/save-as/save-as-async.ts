import { FileSystemFileHandleExt } from "@josundt/file-system";
import { showSaveFilePicker, ShowSaveFilePickerTypes } from "@josundt/file-system/show-save-file-picker";
import { extensionsMimeMap } from "./extensions-mime-map.js";

export async function saveAsAsync(
    url: string,
    getResponseAsync: (url: string) => Promise<Response>,
    fileName?: string
): Promise<void> {

    // If filename is not specified, try to get it from the
    const extension = fileName?.split(".").pop();
    const mimeType = !extension ? undefined : extensionsMimeMap.get(extension.toLowerCase());
    const types: ShowSaveFilePickerTypes[] = !mimeType || !extension ? [] : [{
        accept: { [mimeType]: [`.${extension}`] }
    }];

    let fileHandle: FileSystemFileHandleExt | undefined;
    try {
        /* eslint-disable @typescript-eslint/naming-convention */
        fileHandle = await showSaveFilePicker({
            suggestedName: fileName,
            types: types,
            excludeAcceptAllOption: !!(mimeType) // default
        });
    /* eslint-disable @typescript-eslint/naming-convention */
    } catch (err) {
        // Errors may be thrown f.ex. if user closes saveAs dialog
        if (!(err instanceof DOMException && err.name === "AbortError")) {
            throw err;
        }
    }

    if (fileHandle) {
        const response = await getResponseAsync(url);
        const writableStream = await fileHandle.createWritable();

        await response.body!.pipeTo(writableStream);
    }

}
