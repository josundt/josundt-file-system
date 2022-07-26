import { setPonyFillDownloadCallback, type WebStreamsTypeLib } from "@josundt/file-system";
import { downloadAsync } from "./download/download-async.js";
import { saveAsAsync } from "./save-as/save-as-async.js";

// Required polyfills:
// https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs:
//    - TransformStream (required for downloader/file-handle.js)
//    - WritableStream (required for writable-file-stream-wrapper.js & download/file-handle.js)

// You may need to move this to our preferred CDN for CSP policy
const ponyfillUrl = "https://static.adra.com/web-stream-polyfills/v3.2.1/ponyfill.es2018.min.mjs"; //"https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs";
const defaultAssetUrl = `${location.protocol}//${location.host}/sample-photo.jpg`;

const c: Console = console;

async function registerWorker(): Promise<ServiceWorkerRegistration | undefined> {
    // declaring scope manually
    let registration: ServiceWorkerRegistration | undefined;

    if ("serviceWorker" in navigator) {
        try {
            registration = await navigator.serviceWorker.register("/service-worker.js", {
                scope: "./",
                type: "module",
                updateViaCache: "imports",
            });
            c.info("Service worker registration succeeded:", registration);
        } catch (err) {
            c.error("Service worker registration failed:", err);
        }
    } else {
        c.warn("Service workers are not supported.");
    }

    return registration;
}

function tryGetFileNameFromUrl(url: string): string | undefined {
    let result: string | undefined;
    const lastSegment = new URL(url).pathname.split("/").pop();
    if (lastSegment?.includes(".")) {
        result = lastSegment;
    }
    return result;
}

function onSubmit(ev: Event): Promise<void> {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const strategy = (form["downloadStrategy"] as HTMLInputElement).value;
    const url = (form["url"]! as HTMLInputElement).value;
    const fileName = tryGetFileNameFromUrl(url);

    const getResponseAsync = async (u: string): Promise<Response> => {
        const response = await fetch(u, {
            headers: {
                // Set authorization headers etc
                // authorization: "Bearer token-here"
            }
        });
        // Ensure that resposne is OK before write to disk
        if (!response.ok) {
            throw new Error(`Download failed! (response status: ${response.status}`);
        }
        return response;
    };

    const preferServiceWorker = (form["preferServiceWorker"] as HTMLInputElement).checked;

    switch (strategy) {
        case "download": return downloadAsync(url, getResponseAsync, preferServiceWorker, fileName);
        case "saveAs": return saveAsAsync(url, getResponseAsync, preferServiceWorker, fileName);
        default: throw new Error("Unknown strategy");
    }
}

async function start(): Promise<void> {
    await registerWorker();

    // NB!!! Important to set your polyfill download function!
    setPonyFillDownloadCallback(
        () => import(/* webpackIgnore: true */ ponyfillUrl) as Promise<WebStreamsTypeLib>,
        //true
    );
}

const formElem = document.querySelector("form")! as HTMLFormElement;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
formElem.addEventListener("submit", onSubmit);
(formElem["url"] as HTMLInputElement).value = defaultAssetUrl;

// const token = "foo_token";
// // eslint-disable-next-line @typescript-eslint/no-misused-promises
// navigator.serviceWorker.addEventListener("message", e => {
//     if (typeof e.data === "object" && "kind" in e.data && (e.data as Record<string, string>)["kind"] === "tokenRequest") {
//         const { active: sw } = (swReg ?? {});
//         if (sw) {
//             sw.postMessage({ token: token });
//         }
//     }
// });

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start();