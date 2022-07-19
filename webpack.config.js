import ResolveTypescriptPlugin from "resolve-typescript-plugin";
import path from "node:path";

export default (env, { mode }) => {
    const config = {
        target: "web",
        devtool: mode === "production" ? "nosources-source-map" : "eval-cheap-module-source-map",
        entry: { "main": "./src/sample/index.ts" },
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            plugins: [new ResolveTypescriptPlugin()]
        },
        module: {
            rules: [
                { test: /\.tsx?$/i, include: path.resolve("./src"), exclude: /node_modules/, use: [
                    { loader: "ts-loader", options: { configFile: 'tsconfig.json' } }
                ] }
            ]
        }
    };

    return config;
}
