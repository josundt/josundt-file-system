import { FileSystemWritableFileStream } from "./writable-file-stream.js";

export interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean;
    /* Not in spec */
    size?: number;
}

export interface FileSystemFileHandleExtended extends FileSystemHandleExtended {
    readonly kind: "file";
    getFile(): Promise<File>;
    createWritable<W>(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemQueryPermissionsArgs {
    mode: "read" | "write" | "readwrite";
}

export type FileSystemQueryPermissionsResult = "granted" | "denied";

export type FileSystemQueryPermissionsFn =
    (options: FileSystemQueryPermissionsArgs) => Promise<FileSystemQueryPermissionsResult>;

export interface FileSystemHandleRemoveArgs {
    recursive?: boolean;
}

export interface FileSystemHandleExtended {
    readonly kind: FileSystemHandleKind;
    readonly name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;

    // extensions:
    writable?: boolean;
    queryPermission?: FileSystemQueryPermissionsFn;
    requestPermission?: FileSystemQueryPermissionsFn;
    remove: (args: FileSystemHandleRemoveArgs) => Promise<void>;
}

const kAdapter = Symbol("adapter");

export class FileSystemHandlePoly implements FileSystemHandleExtended {

    constructor(adapter: FileSystemFileHandleExtended) {
        this.kind = adapter.kind;
        this.name = adapter.name;
        this[kAdapter] = adapter;
    }

    readonly name: string;
    readonly kind: FileSystemHandleKind;

    isSameEntry(other: FileSystemHandleExtended): Promise<boolean> {
        if (this === other) {
            return Promise.resolve(true);
        }
        if (
            (!other) ||
            (typeof other !== "object") ||
            (this.kind !== other.kind) ||
            (!(other as FileSystemHandlePoly)[kAdapter])
        ) {
            return Promise.resolve(false);
        }

        return this[kAdapter].isSameEntry((other as FileSystemHandlePoly)[kAdapter]);
    }

    // The rest is extensions...

    [kAdapter]: FileSystemFileHandleExtended;

    queryPermission(options?: FileSystemQueryPermissionsArgs): Promise<FileSystemQueryPermissionsResult> {
        const handle = this[kAdapter];
        const mode = options?.mode ?? "read";

        if (handle.queryPermission) {
            return handle.queryPermission({ mode: mode });
        }

        if (mode === "read") {
            return Promise.resolve("granted");
        } else if (mode === "readwrite") {
            return Promise.resolve(handle.writable ? "granted" : "denied");
        } else {
            throw new TypeError(`Mode ${mode} must be 'read' or 'readwrite'`);
        }
    }

    requestPermission: FileSystemQueryPermissionsFn = this.queryPermission.bind(this);

    /**
     * Attempts to remove the entry represented by handle from the underlying file system.
     * @param args The options
     * @returns Promise
     */
    remove(args: FileSystemHandleRemoveArgs): Promise<void> {
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
