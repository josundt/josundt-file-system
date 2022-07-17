const ws = globalThis.WritableStream;
// || await import('https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs').then(r => r.WritableStream).catch(() => import('web-streams-polyfill').then(r => r.WritableStream))
export class FileSystemWritableFileStreamWrapper extends ws {
    constructor(underlyingSink, strategy) {
        super(underlyingSink, strategy);
        this._closed = false;
        // Stupid Safari hack to extend native classes
        // https://bugs.webkit.org/show_bug.cgi?id=226201
        Object.setPrototypeOf(this, FileSystemWritableFileStreamWrapper.prototype);
    }
    close() {
        this._closed = true;
        const w = this.getWriter();
        const p = w.close();
        w.releaseLock();
        return p;
        // return super.close ? super.close() : this.getWriter().close()
    }
    seek(position) {
        return this.write({ type: "seek", position: position });
    }
    truncate(size) {
        return this.write({ type: "truncate", size: size });
    }
    write(chunk) {
        if (this._closed) {
            return Promise.reject(new TypeError("Cannot write to a CLOSED writable stream"));
        }
        const writer = this.getWriter();
        const p = writer.write(chunk);
        writer.releaseLock();
        return p;
    }
}
Object.defineProperty(FileSystemWritableFileStreamWrapper.prototype, Symbol.toStringTag, {
    value: "FileSystemWritableFileStream",
    writable: false,
    enumerable: false,
    configurable: true
});
Object.defineProperties(FileSystemWritableFileStreamWrapper.prototype, {
    close: { enumerable: true },
    seek: { enumerable: true },
    truncate: { enumerable: true },
    write: { enumerable: true }
});
//# sourceMappingURL=writable-file-stream-wrapper.js.map