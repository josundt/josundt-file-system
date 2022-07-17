import { FileSystemDownloadFileHandle } from "./adapters/downloader.js";
import FileSystemHandlePoly from "./handle-poly.js";
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const native = globalThis.showSaveFilePicker;
const polyfill = async function (options = {}) {
    if (native && !options._preferPolyfill) {
        return native(options);
    }
    const fileHandle = new FileSystemDownloadFileHandle(options.suggestedName);
    return new FileSystemHandlePoly(fileHandle);
};
const showSaveFilePicker = native !== null && native !== void 0 ? native : polyfill;
export default showSaveFilePicker;
export { showSaveFilePicker };
//# sourceMappingURL=show-save-file-picker.js.map