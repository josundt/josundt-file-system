export interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean;
    /* Not in spec */
    size?: number;
}

export interface SeekWriteArgument {
    type: "seek";
    position: number;
}

export interface TruncateWriteArgument {
    type: "truncate";
    size: number;
}

export type ExtendedWriteType<W> = W | SeekWriteArgument | TruncateWriteArgument;

export interface FileSystemWritableFileStream<W = any> extends WritableStream<ExtendedWriteType<W>> {
    close(): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
    write(chunk?: ExtendedWriteType<W>): Promise<void>;
}

export interface FileSystemFileHandleExt extends FileSystemHandle {
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

