import { showSaveFilePicker } from "./file-system/show-save-file-picker.js";
// const dirHandle = await getOriginPrivateDirectory(downloader);
async function saveAsAsync(url) {
    /* eslint-disable @typescript-eslint/naming-convention */
    const fileHandle = await showSaveFilePicker({
        _preferPolyfill: false,
        suggestedName: "Untitled.jpg",
        accepts: [
            { accept: { "image/png": ["png"] } },
            { accept: { "image/jpg": ["jpg"] } },
            { accept: { "image/webp": ["webp"] } }
        ],
        excludeAcceptAllOption: false // default
    });
    /* eslint-disable @typescript-eslint/naming-convention */
    const response = await fetch(url);
    const writableStream = await fileHandle.createWritable();
    await response.body.pipeTo(writableStream);
}
document.getElementById("download").addEventListener("click", () => {
    const url = "https://images.pexels.com/photos/220067/pexels-photo-220067.jpeg?cs=srgb&dl=pexels-pixabay-220067.jpg&fm=jpg";
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    saveAsAsync(url);
});
//# sourceMappingURL=index.js.map