export abstract class FileSystemHandleBase<TKind extends FileSystemHandleKind> implements FileSystemHandle {

    constructor(kind: TKind, name: string) {
        this.kind = kind;
        this.name = name;
    }

    readonly name: string;
    readonly kind: TKind;

    isSameEntry(other: FileSystemHandle): Promise<boolean> {
        return Promise.resolve(this === other);
    }
}

Object.defineProperty(FileSystemHandleBase.prototype, Symbol.toStringTag, {
    value: "FileSystemHandle",
    writable: false,
    enumerable: false,
    configurable: true
});
