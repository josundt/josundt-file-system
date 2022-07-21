import ResolveTypescriptPlugin from "resolve-typescript-plugin";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

import path from "node:path";
export default (env, { mode = "development" }) => {
    const config = {
        target: "web",
        mode: mode,
        devtool: mode === "production" ? "nosources-source-map" : "eval-cheap-module-source-map",
        entry: { "index": "./src/sample/index.ts" },
        performance: { hints: false },
        output: {
            path: path.resolve("./dist/sample")
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            plugins: [new ResolveTypescriptPlugin()],
            alias: {
                "@josundt/file-system/downloader": path.resolve("./src/file-system/downloader/file-handle.ts"),
                "@josundt/file-system/show-save-file-picker": path.resolve("./src/file-system/show-save-file-picker.ts"),
                "@josundt/file-system": path.resolve("./src/file-system/index.ts")
            }
        },
        module: {
            rules: [
                { test: /\.tsx?$/i, include: path.resolve("./src"), exclude: /node_modules/, use: [
                    { loader: "ts-loader", options: { configFile: "tsconfig.json" } }
                ] }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: path.resolve("./src/sample/index.html"),
                filename: "index.html",
                favicon: path.resolve("./src/sample/favicon.ico")
            }),
            new CopyPlugin({
                patterns: [
                    { from: "src/sample/index.css" },
                    { from: "src/sample/sample-photo.jpg" }
                ]
            })
        ]
    };

    return config;
}
