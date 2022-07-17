const ws: typeof WritableStream = globalThis.WritableStream;
// || await import('https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs').then(r => r.WritableStream).catch(() => import('web-streams-polyfill').then(r => r.WritableStream))


interface SeekWriteArgument {
    type: "seek";
    position: number;
}

interface TruncateWriteArgument {
    type: "truncate";
    size: number;
}

type ExtendedWriteType<W> = W | SeekWriteArgument | TruncateWriteArgument;

class FileSystemWritableFileStream<W = any> extends ws<ExtendedWriteType<W>> {
    constructor(underlyingSink?: UnderlyingSink<ExtendedWriteType<W>>, strategy?: QueuingStrategy<ExtendedWriteType<W>>) {
        super(underlyingSink, strategy);

        // Stupid Safari hack to extend native classes
        // https://bugs.webkit.org/show_bug.cgi?id=226201
        Object.setPrototypeOf(this, FileSystemWritableFileStream.prototype);

    }

    private _closed: boolean = false;

    override close(): Promise<void> {
        this._closed = true;
        const w = this.getWriter();
        const p = w.close();
        w.releaseLock();
        return p;
        // return super.close ? super.close() : this.getWriter().close()
    }

    seek(position: number): Promise<void> {
        return this.write({ type: "seek", position: position });
    }

    truncate(size: number): Promise<void> {
        return this.write({ type: "truncate", size: size });
    }

    write(chunk?: ExtendedWriteType<W>): Promise<void> {
        if (this._closed) {
            return Promise.reject(new TypeError("Cannot write to a CLOSED writable stream"));
        }

        const writer = this.getWriter();
        const p = writer.write(chunk);
        writer.releaseLock();
        return p;
    }
}

Object.defineProperty(FileSystemWritableFileStream.prototype, Symbol.toStringTag, {
    value: "FileSystemWritableFileStream",
    writable: false,
    enumerable: false,
    configurable: true
});

Object.defineProperties(FileSystemWritableFileStream.prototype, {
    close: { enumerable: true },
    seek: { enumerable: true },
    truncate: { enumerable: true },
    write: { enumerable: true }
});

export default FileSystemWritableFileStream;

export { FileSystemWritableFileStream };

