import { FileSystemDownloadFileHandle } from "./adapters/downloader.js";
import FileSystemHandlePoly, { FileSystemFileHandleExtended } from "./handle-poly.js";

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ContentTypeExtensionsMap {
    [contentType: string]: string[];
}

export interface FilePickerAccepts {
    accept: ContentTypeExtensionsMap;
}

export interface ShowSaveFilePickerOptions {
    /** Prevent user for selecting any */
    excludeAcceptAllOption?: boolean;
    /** Files you want to accept */
    accepts?: FilePickerAccepts[];
    /** the name to fall back to when using polyfill */
    suggestedName?: string;
    /** If you rather want to use the polyfill instead of the native */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _preferPolyfill?: boolean;
}

export type ShowSaveFilePickerFn = (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandleExtended>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const native = (globalThis as any).showSaveFilePicker as ShowSaveFilePickerFn;

const polyfill: ShowSaveFilePickerFn = async function (
    options: ShowSaveFilePickerOptions = {}
): Promise<FileSystemFileHandleExtended> {

    if (native && !options._preferPolyfill) {
        return native(options);
    }

    const fileHandle = new FileSystemDownloadFileHandle(options.suggestedName);
    return new FileSystemHandlePoly(fileHandle) as unknown as FileSystemFileHandleExtended;

};

const showSaveFilePicker = native ?? polyfill;

export default showSaveFilePicker;

export { showSaveFilePicker };

