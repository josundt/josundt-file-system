import ResolveTypescriptPlugin from "resolve-typescript-plugin";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";

import path from "node:path";

const dirname = path.dirname(path.resolve(import.meta.url.replace(/^(file:\/\/)(\/([A-Z]:))?(\/.*)/i, (s, g1, g2, g3, g4) => `${g3 ?? ""}${g4}`)));

const abs = rel => path.resolve(dirname, rel);

export default (env, { mode = "development" }) => {
    const config = {
        target: "web",
        mode: mode,
        devtool: mode === "production" ? "source-map" : "eval-cheap-module-source-map",
        entry: {
            "index": abs("./src/sample/ui/index.ts"),
            "service-worker": abs("./src/sample/sw/service-worker.ts")
        },
        performance: { hints: false },
        output: {
            path: abs("./dist/sample-webpack"),
            devtoolNamespace: "fs-sample"
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            plugins: [new ResolveTypescriptPlugin()],
            alias: {
                "@josundt/file-system/downloader/sw": abs("./src/file-system/downloader/sw/index.ts"),
                "@josundt/file-system/downloader": abs("./src/file-system/downloader/index.ts"),
                "@josundt/file-system/show-save-file-picker": abs("./src/file-system/show-save-file-picker.ts"),
                "@josundt/file-system": abs("./src/file-system/index.ts")
            }
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/i,
                    include: [
                        abs("./src/file-system"),
                        abs("./src/sample/ui")],
                    exclude: /node_modules/,
                    use: [{
                        loader: "ts-loader",
                        options: {
                            configFile: abs("./src/sample/ui/tsconfig.json"),
                            projectReferences: true
                        }
                    }]
                },
                {
                    test: /\.tsx?$/i,
                    include: [
                        abs("./src/sample/sw")
                    ],
                    exclude: /node_modules/,
                    use: [{
                        loader: "ts-loader",
                        options: {
                            configFile: abs("./src/sample/sw/tsconfig.json"),
                            projectReferences: true
                        }
                    }]
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: abs("./src/sample/index.html"),
                chunks: ["index"],
                filename: "index.html",
                favicon: abs("./src/sample/favicon.ico")
            }),
            new CopyPlugin({
                patterns: [
                    { from: abs("./src/sample/index.css") },
                    { from: abs("./src/sample/sample-photo.jpg") },
                    { from: abs("./src/sample/sample()'#photo copy.jpg") }
                ]
            })
        ],
        devServer: {
            hot: false,
            liveReload: false
        }
    };

    //console.log(config);

    return config;
}
