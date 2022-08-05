/* eslint-disable */
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", ev => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    const ev = e as ExtendableEvent;
    ev.waitUntil(self.clients.claim());
});

const downloadPathRegExp = /sample-photo/;

self.addEventListener("fetch", ev => {
    const req = ev.request;

    if (req.mode === "navigate" && req.method === "GET" && downloadPathRegExp.test(req.url)) {
        ev.respondWith(
            authorizeRequestAndAddContentDispositionResponseHeader(req)
        );
    }
});


async function authorizeRequestAndAddContentDispositionResponseHeader(req: Request): Promise<Response> {
    const clients = await self.clients.matchAll();
    const client = clients[0]; //await clients.get(ev.clientId);

    const token = await getTokenFromClientAsync(client!);

    const newReq = cloneRequestAndAddHeaders(
        req,
        ["authorization", `Bearer ${token}`]
    );
        const fileName = tryGetFileNameFromUrl(newReq.url) ?? "File";
    const res = await fetch(newReq);
    if (!res.ok) {
        return res;
    } else {
        return cloneResponseAndAddHeaders(
            res,
            ["content-disposition", `attachment; filename="${fileName}"`]
        );
    }
}

async function getTokenFromClientAsync(client: Client, timeout: number = 60_000): Promise<string> {
    const token = await Promise.race([

        new Promise<string>((resolve, reject) => {
            const handleMessage = (ev: ExtendableMessageEvent) => {
                if (typeof ev.data === "object" && "token" in ev.data) {
                    resolve(ev.data.token);
                    self.removeEventListener("message", handleMessage);
                }
            };
            self.addEventListener("message", handleMessage);
            client.postMessage({ kind: "tokenRequest" });
        }),
        new Promise((resolve, reject) =>
            setTimeout(() => reject(new Error("Timed out")), timeout)
        )
    ]);

    return token as string;
}

function cloneRequestAndAddHeaders(
    req: Request,
    ...additionalHeaders: Array<[string, string]>
): Request {
    const newHeadersInit: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        newHeadersInit[key] === value;
    });
    for (const [key, value] of additionalHeaders) {
        newHeadersInit[key] = value;
    }
    return new Request(req, {
        headers: newHeadersInit
    });
}

function cloneResponseAndAddHeaders(
    res: Response,
    ...additionalHeaders: Array<[string, string]>
): Response {
    const newHeadersInit: Record<string, string> = {};
    res.headers.forEach((value, key) => {
        newHeadersInit[key] === value;
    });
    for (const [key, value] of additionalHeaders) {
        newHeadersInit[key] = value;
    }
    return new Response(res.body, {
        headers: newHeadersInit
    });
}

function tryGetFileNameFromUrl(url: string): string | undefined {
    let result;
    const lastSegment = new URL(url).pathname.split("/").pop();
    if (lastSegment?.includes(".")) {
        result = lastSegment;
    }
    return result;
}

