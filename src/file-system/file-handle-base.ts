import { FileSystemCreateWritableOptions, FileSystemFileHandleExt, FileSystemWritableFileStream } from "./abstractions.js";
import { FileSystemHandleBase } from "./handle-base.js";
import { getFileSystemWritableFileStreamWrapperTypeAsync } from "./lib/writable-file-stream-wrapper.js";

export abstract class FileSystemFileHandleBase
    extends FileSystemHandleBase<"file">
    implements FileSystemFileHandleExt {

    constructor(kind: "file", name: string) {
        super(kind, name);
    }

    async createWritable<W>(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream> {
        options ??= {};

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const FileSystemWritableFileStreamWrapper = await getFileSystemWritableFileStreamWrapperTypeAsync();

        return new FileSystemWritableFileStreamWrapper(
            (await this.createWritableInternal(options))
        );
    }

    abstract getFile(): Promise<File>;

    protected abstract createWritableInternal<W>(options?: FileSystemCreateWritableOptions): Promise<WritableStreamDefaultWriter>;

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
