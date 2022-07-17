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

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const native = (globalThis as any).showSaveFilePicker as ShowSaveFilePickerFn;

const polyfill: ShowSaveFilePickerFn = async function (
    options: ShowSaveFilePickerOptions = {}
): Promise<FileSystemFileHandleExt> {

    return Promise.resolve(new DownloadFileHandle(options.suggestedName));

};

export const showSaveFilePicker = native ?? polyfill;

