/* eslint-disable */
import { showSaveFilePicker } from "./file-system/show-save-file-picker.js";
// import { FileSystemDownloadFileHandle as download } from "./file-system/adapters/downloader.js";

function generateCanvasBlob({ type, format }: { type: string; format: string; }): typeof window["Blob"]["prototype"] {
    return new window.Blob(undefined, {
        type: type
    });
}

// const dirHandle = await getOriginPrivateDirectory(downloader);
async function downloadAsync(): Promise<void> {
    const fileHandle = await showSaveFilePicker({
        _preferPolyfill: false,
        suggestedName: "Untitled.png",
        accepts: [
          { accept: { "image/png": [ "png" ] } },
          { accept: { "image/jpg": [ "jpg" ] } },
          { accept: { "image/webp": [ "webp" ] } }
        ],
        excludeAcceptAllOption: false // default
      });

      // Look at what extension they chosen
      const extensionChosen = fileHandle.name.split(".").pop()!;

      const blob: typeof window["Blob"]["prototype"] = {
        jpg: generateCanvasBlob({ type: "blob", format: "jpg" }),
        png: generateCanvasBlob({ type: "blob", format: "png" }),
        webp: generateCanvasBlob({ type: "blob", format: "webp" })
      }[extensionChosen]!;

      const writableStream = await fileHandle.createWritable();
      await (blob.stream() as unknown as ReadableStream<Uint8Array>).pipeTo(writableStream);
      // or
      const writer = await fileHandle.createWritable();
      await writer.write(blob);
      await writer.close();
}

downloadAsync();
