/* eslint-disable */
declare const self: ServiceWorkerGlobalScope;

import { MessagePortResponseMessage, MessagePortSource } from "@josundt/file-system/downloader/sw";


self.addEventListener("install", ev => {
    self.skipWaiting();
});

self.addEventListener("activate", ev => {
    ev.waitUntil(self.clients.claim());
});

const map = new Map();

// This should be called once per download
// Each event has a dataChannel that the data will be piped through
self.addEventListener("message", ev => {
    const data = ev.data as MessagePortResponseMessage;
    if (ev.data === "keepAlive") {
        console.log("Keep alive", map.size);
    }
    if (data.url && data.readablePort) {
        data.rs = new ReadableStream(
            new MessagePortSource(data.readablePort),
            new CountQueuingStrategy({ highWaterMark: 4 })
        );
        map.set(data.url, data);
    }
});

self.addEventListener("fetch", ev => {
    const url = ev.request.url;
    const data = map.get(url);
    if (!data) {
        return;
    }
    map.delete(url);
    ev.respondWith(new Response(data.rs, {
        headers: data.headers
    }));
});
