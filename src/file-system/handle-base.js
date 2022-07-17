export class FileSystemHandleBase {
    constructor(kind, name) {
        this.kind = kind;
        this.name = name;
    }
    isSameEntry(other) {
        return Promise.resolve(this === other);
    }
}
Object.defineProperty(FileSystemHandleBase.prototype, Symbol.toStringTag, {
    value: "FileSystemHandle",
    writable: false,
    enumerable: false,
    configurable: true
});
//# sourceMappingURL=handle-base.js.map