/* eslint-disable */
import { handleDownloadFetchEvent, handleDownloadMessageEvent } from "@josundt/file-system/downloader/sw";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", ev => {
    self.skipWaiting();
});

self.addEventListener("activate", ev => {
    ev.waitUntil(self.clients.claim());
});

// This should be called once per download
// Each event has a dataChannel that the data will be piped through
self.addEventListener("message", handleDownloadMessageEvent);

self.addEventListener("fetch", handleDownloadFetchEvent);
