import { FileSystemFileHandleExt } from "./abstractions.js";
import { DownloadFileHandle } from "./downloader/file-handle.js";

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ContentTypeExtensionsMap {
    [contentType: string]: string[];
}

export interface ShowSaveFilePickerTypes {
    description?: string;
    accept: ContentTypeExtensionsMap;
}

export interface ShowSaveFilePickerOptions {
    /** Prevent user for selecting any */
    excludeAcceptAllOption?: boolean;
    /** Files you want to accept */
    types?: ShowSaveFilePickerTypes[];
    /** the name to fall back to when using polyfill */
    suggestedName?: string;
}

export type ShowSaveFilePickerFn = (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandleExt>;

export function getShowSaveFilePicker(preferServiceWorker: boolean): ShowSaveFilePickerFn {
    // If global showSaveFilePicker is supported, use FileHandle returned from dialog
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const showSaveFilePickerFileHandle = (globalThis as any).showSaveFilePicker as ShowSaveFilePickerFn;

    // Fallback to use DownloadFileHandle
    const downloadFileHandle: ShowSaveFilePickerFn = async function (
        options: ShowSaveFilePickerOptions = {}
    ): Promise<FileSystemFileHandleExt> {

        return Promise.resolve(new DownloadFileHandle({ filename: options.suggestedName, preferServiceWorker: preferServiceWorker }));

    };

    return showSaveFilePickerFileHandle ?? downloadFileHandle;
}


