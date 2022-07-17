import { extensionsMimeMap } from "./extensions-mime-map.js";
import { showSaveFilePicker } from "./file-system/show-save-file-picker.js";
export async function saveAsAsync(url, getResponseAsync, fileName) {
    // If filename is not specified, try to get it from the
    fileName !== null && fileName !== void 0 ? fileName : (fileName = tryGetFileNameFromUrl(url));
    const extension = fileName === null || fileName === void 0 ? void 0 : fileName.split(".").pop();
    const mimeType = !extension ? undefined : extensionsMimeMap.get(extension.toLowerCase());
    const types = !mimeType || !extension ? [] : [{
            accept: { [mimeType]: [`.${extension}`] }
        }];
    let fileHandle;
    try {
        /* eslint-disable @typescript-eslint/naming-convention */
        fileHandle = await showSaveFilePicker({
            suggestedName: fileName,
            types: types,
            excludeAcceptAllOption: !!(mimeType) // default
        });
        /* eslint-disable @typescript-eslint/naming-convention */
    }
    catch (err) {
        // Errors may be thrown f.ex. if user closes saveAs dialog
        if (!(err instanceof DOMException && err.name === "AbortError")) {
            throw err;
        }
    }
    if (fileHandle) {
        const response = await getResponseAsync(url);
        const writableStream = await fileHandle.createWritable();
        await response.body.pipeTo(writableStream);
    }
}
function tryGetFileNameFromUrl(url) {
    let result;
    const lastSegment = new URL(url).pathname.split("/").pop();
    if (lastSegment === null || lastSegment === void 0 ? void 0 : lastSegment.includes(".")) {
        result = lastSegment;
    }
    return result;
}
//# sourceMappingURL=save-as-async.js.map