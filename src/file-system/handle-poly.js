const kAdapter = Symbol("adapter");
export class FileSystemHandlePoly {
    constructor(adapter) {
        this.requestPermission = this.queryPermission.bind(this);
        this.kind = adapter.kind;
        this.name = adapter.name;
        this[kAdapter] = adapter;
    }
    isSameEntry(other) {
        if (this === other) {
            return Promise.resolve(true);
        }
        if ((!other) ||
            (typeof other !== "object") ||
            (this.kind !== other.kind) ||
            (!other[kAdapter])) {
            return Promise.resolve(false);
        }
        return this[kAdapter].isSameEntry(other[kAdapter]);
    }
    queryPermission(options) {
        var _a;
        const handle = this[kAdapter];
        const mode = (_a = options === null || options === void 0 ? void 0 : options.mode) !== null && _a !== void 0 ? _a : "read";
        if (handle.queryPermission) {
            return handle.queryPermission({ mode: mode });
        }
        if (mode === "read") {
            return Promise.resolve("granted");
        }
        else if (mode === "readwrite") {
            return Promise.resolve(handle.writable ? "granted" : "denied");
        }
        else {
            throw new TypeError(`Mode ${mode} must be 'read' or 'readwrite'`);
        }
    }
    /**
     * Attempts to remove the entry represented by handle from the underlying file system.
     * @param args The options
     * @returns Promise
     */
    remove(args) {
        return this[kAdapter].remove(args);
    }
}
Object.defineProperty(FileSystemHandle.prototype, Symbol.toStringTag, {
    value: "FileSystemHandle",
    writable: false,
    enumerable: false,
    configurable: true
});
export default FileSystemHandlePoly;
//# sourceMappingURL=handle-poly.js.map