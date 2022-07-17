import { setPonyFillDownloadCallback } from "./file-system/lib/web-streams-ponyfill-factory.js";
import { saveAsAsync } from "./save-as-async.js";
// Required polyfills:
// https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs:
//    - TransformStream (required for downloader/file-handle.js)
//    - WritableStream (required for writable-file-stream-wrapper.js & download/file-handle.js)
function onDownloadButtonCliced() {
    const url = "https://images.pexels.com/photos/220067/pexels-photo-220067.jpeg?cs=srgb&dl=pexels-pixabay-220067.jpg&fm=jpg";
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    saveAsAsync(url, u => fetch(u, {
    // Set authorization headers etc
    }));
}
setPonyFillDownloadCallback(() => {
    // Need to move this to our own CDN for CSP policy
    const url = "https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs";
    return import(/* webpackIgnore: true */ url);
});
document.getElementById("download").addEventListener("click", onDownloadButtonCliced);
//# sourceMappingURL=index.js.map