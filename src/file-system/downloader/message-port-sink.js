var MessagePortSinkEventType;
(function (MessagePortSinkEventType) {
    MessagePortSinkEventType[MessagePortSinkEventType["Write"] = 0] = "Write";
    MessagePortSinkEventType[MessagePortSinkEventType["Pull"] = 1] = "Pull";
    MessagePortSinkEventType[MessagePortSinkEventType["Error"] = 2] = "Error";
    MessagePortSinkEventType[MessagePortSinkEventType["Abort"] = 3] = "Abort";
    MessagePortSinkEventType[MessagePortSinkEventType["Close"] = 4] = "Close";
})(MessagePortSinkEventType || (MessagePortSinkEventType = {}));
export class MessagePortSink {
    constructor(port) {
        this._readyPending = false;
        port.onmessage = (event) => this._onMessage(event.data);
        this._port = port;
        this._resetReady();
    }
    start(controller) {
        this._controller = controller;
        // Apply initial backpressure
        return this._readyPromise;
    }
    write(chunk, controller) {
        const message = { type: MessagePortSinkEventType.Write, chunk: chunk };
        // Send chunk
        this._port.postMessage(message, [chunk.buffer]);
        // Assume backpressure after every write, until sender pulls
        this._resetReady();
        // Apply backpressure
        return this._readyPromise;
    }
    close() {
        this._port.postMessage({ type: MessagePortSinkEventType.Close });
        this._port.close();
    }
    abort(reason) {
        this._port.postMessage({ type: MessagePortSinkEventType.Abort, reason: reason });
        this._port.close();
    }
    _onMessage(message) {
        if (message.type === MessagePortSinkEventType.Pull || message.type === MessagePortSinkEventType.Write) {
            this._resolveReady();
        }
        if (message.type === MessagePortSinkEventType.Error || message.type === MessagePortSinkEventType.Abort) {
            this._onError(message.reason);
        }
    }
    _onError(reason) {
        this._controller.error(reason);
        this._rejectReady(reason);
        this._port.close();
    }
    _resetReady() {
        this._readyPromise = new Promise((resolve, reject) => {
            this._readyResolve = resolve;
            this._readyReject = reject;
        });
        this._readyPending = true;
    }
    _resolveReady() {
        this._readyResolve();
        this._readyPending = false;
    }
    _rejectReady(reason) {
        if (!this._readyPending) {
            this._resetReady();
        }
        this._readyPromise.catch(() => {
            // Unhandled
        });
        this._readyReject(reason);
        this._readyPending = false;
    }
}
//# sourceMappingURL=message-port-sink.js.map