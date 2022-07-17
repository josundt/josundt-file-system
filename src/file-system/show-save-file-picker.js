import { DownloadFileHandle } from "./downloader/file-handle.js";
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const native = globalThis.showSaveFilePicker;
const polyfill = async function (options = {}) {
    return Promise.resolve(new DownloadFileHandle(options.suggestedName));
};
export const showSaveFilePicker = native !== null && native !== void 0 ? native : polyfill;
//# sourceMappingURL=show-save-file-picker.js.map