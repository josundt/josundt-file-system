import { ExtendedWriteType, FileSystemWritableFileStream } from "../abstractions.js";
import { getStreamsApiDepsAsync } from "./web-streams-ponyfill-factory.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const FileSystemWritableFileStream: {
    prototype: FileSystemWritableFileStream;
    new<W = any>(underlyingSink?: UnderlyingSink<W>, strategy?: QueuingStrategy<W>): FileSystemWritableFileStream<W>;
};

let classTypeCached: typeof FileSystemWritableFileStream; // FileSystemWritableFileStream<W> | undefined;

// Need to use "class factory" pattern, because class extends from dynamically ponyfilled base class 'WritableStream'

export async function getFileSystemWritableFileStreamWrapperTypeAsync(): Promise<typeof FileSystemWritableFileStream> {

    if (!classTypeCached) {

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { WritableStream } = await getStreamsApiDepsAsync(); // Ponyfill if required

        const classType = class FileSystemWritableStreamWrapper<W>
            extends WritableStream<ExtendedWriteType<W>>
            implements FileSystemWritableFileStream<W> {

            constructor(underlyingSink?: UnderlyingSink<ExtendedWriteType<W>>, strategy?: QueuingStrategy<ExtendedWriteType<W>>) {
                super(underlyingSink, strategy);

                // Stupid Safari hack to extend native classes
                // https://bugs.webkit.org/show_bug.cgi?id=226201
                Object.setPrototypeOf(this, classType.prototype);

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
        };

        Object.defineProperty(classType.prototype, Symbol.toStringTag, {
            value: "FileSystemWritableFileStream",
            writable: false,
            enumerable: false,
            configurable: true
        });

        Object.defineProperties(classType.prototype, {
            close: { enumerable: true },
            seek: { enumerable: true },
            truncate: { enumerable: true },
            write: { enumerable: true }
        });

        classTypeCached = classType as typeof FileSystemWritableFileStream;
    }

    return classTypeCached;

}

