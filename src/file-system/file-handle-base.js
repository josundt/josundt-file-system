import { FileSystemHandleBase } from "./handle-base.js";
import { FileSystemWritableFileStreamWrapper } from "./lib/writable-file-stream-wrapper.js";
export class FileSystemFileHandleBase extends FileSystemHandleBase {
    constructor(kind, name) {
        super(kind, name);
    }
    async createWritable(options) {
        options !== null && options !== void 0 ? options : (options = {});
        return new FileSystemWritableFileStreamWrapper((await this.createWritableInternal(options)));
    }
}
Object.defineProperty(FileSystemFileHandleBase.prototype, Symbol.toStringTag, {
    value: "FileSystemFileHandle",
    writable: false,
    enumerable: false,
    configurable: true
});
Object.defineProperties(FileSystemFileHandleBase.prototype, {
    createWritable: { enumerable: true },
    getFile: { enumerable: true }
});
//# sourceMappingURL=file-handle-base.js.map