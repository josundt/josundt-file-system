import { FileSystemCreateWritableOptions, FileSystemFileHandleExt, FileSystemWritableFileStream } from "./abstractions.js";
import { FileSystemHandleBase } from "./handle-base.js";
import { FileSystemWritableFileStreamWrapper } from "./lib/writable-file-stream-wrapper.js";


export abstract class FileSystemFileHandleBase
    extends FileSystemHandleBase<"file">
    implements FileSystemFileHandleExt {

    constructor(kind: "file", name: string) {
        super(kind, name);
    }

    async createWritable<W>(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream> {
        options ??= {};

        return new FileSystemWritableFileStreamWrapper(
            (await this.createWritableInternal(options))
        );
    }

    abstract getFile(): Promise<File>;

    protected abstract createWritableInternal<W>(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;

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
