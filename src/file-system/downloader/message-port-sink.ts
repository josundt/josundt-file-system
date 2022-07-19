enum MessagePortSinkEventType {
    Write = 0,
    Pull = 1,
    Error = 2,
    Abort = 3,
    Close = 4
}

interface MessagePortSinkEventData {
    type: MessagePortSinkEventType;
    reason: string;
}

export class MessagePortSink<W extends Uint8Array> implements UnderlyingSink<W> {
    constructor(port: MessagePort) {

        port.onmessage = (event: MessageEvent<MessagePortSinkEventData>) => this._onMessage(event.data);

        this._port = port;
        this._resetReady();
    }

    private readonly _port: MessagePort;
    private _controller?: WritableStreamDefaultController;
    private _readyPending: boolean = false;
    private _readyPromise?: Promise<void>;
    private _readyResolve?: () => void;
    private _readyReject?: (reason: MessagePortSinkEventData["reason"]) => void;

    start(controller: WritableStreamDefaultController): any {
        this._controller = controller;
        // Apply initial backpressure
        return this._readyPromise;
    }

    write(chunk: W, controller: WritableStreamDefaultController): void | PromiseLike<void> {
        const message = { type: MessagePortSinkEventType.Write, chunk: chunk };

        // Send chunk
        this._port.postMessage(message, [chunk.buffer]);

        // Assume backpressure after every write, until sender pulls
        this._resetReady();

        // Apply backpressure
        return this._readyPromise;
    }

    close(): void {
        this._port.postMessage({ type: MessagePortSinkEventType.Close });
        this._port.close();
    }

    abort(reason: MessagePortSinkEventData["reason"]): void {
        this._port.postMessage({ type: MessagePortSinkEventType.Abort, reason: reason });
        this._port.close();
    }

    private _onMessage(message: MessagePortSinkEventData): void {
        if (message.type === MessagePortSinkEventType.Pull || message.type === MessagePortSinkEventType.Write) {
            this._resolveReady();
        }
        if (message.type === MessagePortSinkEventType.Error || message.type === MessagePortSinkEventType.Abort) {
            this._onError(message.reason);
        }
    }

    private _onError(reason: MessagePortSinkEventData["reason"]): void {
        this._controller!.error(reason);
        this._rejectReady(reason);
        this._port.close();
    }

    private _resetReady(): void {
        this._readyPromise = new Promise((resolve, reject) => {
            this._readyResolve = resolve;
            this._readyReject = reject;
        });
        this._readyPending = true;
    }

    private _resolveReady(): void {
        this._readyResolve!();
        this._readyPending = false;
    }

    private _rejectReady(reason: MessagePortSinkEventData["reason"]): void {
        if (!this._readyPending) {
            this._resetReady();
        }
        this._readyPromise!.catch(() => {
            // Unhandled
        });
        this._readyReject!(reason);
        this._readyPending = false;
    }
}