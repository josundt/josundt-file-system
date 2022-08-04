import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const dirname = path.dirname(path.resolve(import.meta.url.replace(/^(file:\/\/)(\/([A-Z]:))?(\/.*)/i, (s, g1, g2, g3, g4) => `${g3 ?? ""}${g4}`)));
const abs = rel => path.resolve(dirname, rel);

const sampleSrc = abs("./src/sample");
const sampleDst = abs("./dist/sample-esm");

const copyFileAsync = promisify(fs.copyFile);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const copySampleFileAsync = (filename) => copyFileAsync(
    path.join(sampleSrc, filename),
    path.join(sampleDst, filename)
);

const transformSampleFileAsync = async (filename, srcDir, cbTransform) => {
    const content = await readFileAsync(path.join(srcDir, filename));
    const transformed = cbTransform(content.toString());
    await writeFileAsync(path.join(sampleDst, filename), transformed);
    return transformed;
};

await copySampleFileAsync("index.css");
await copySampleFileAsync("favicon.ico");
await copySampleFileAsync("sample-photo.jpg");
await copySampleFileAsync("sample()'#photo copy.jpg");

const minify = false;

// Insert import map (PS! only supported by chromium browsers yet (aug 2022))
const importmap = {
    imports: {
        "@josundt/file-system/downloader/sw": "/file-system/downloader/sw/index.js",
        "@josundt/file-system/downloader": "/file-system/downloader/index.js",
        "@josundt/file-system/show-save-file-picker": "/file-system/show-save-file-picker.js",
        "@josundt/file-system": "/file-system/index.js"
    }
};

const headLines = [
    `<link rel="shortcut icon" href="./favicon.ico"/>`,
    `<script type="importmap">${JSON.stringify(importmap, null, minify ? 0 : 2)}</script>`,
    `<script type="module" src="./index.js" defer></script>`
];

const lfIndent = minify ? "" : "\n    ";

await transformSampleFileAsync("index.html", sampleSrc, html =>
    html.replace(/\s*\<\s*\/\s*head\s*>/i, s => `${lfIndent}${headLines.join(lfIndent)}${s}`)
);

// Need to replace module alias from service-worker because service workers do not support importmaps
await transformSampleFileAsync("service-worker.js", sampleDst, js =>
    js.replace("@josundt/file-system/downloader/sw", "/file-system/downloader/sw/index.js")
);
