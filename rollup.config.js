import path from "path";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";

import { name } from "./package.json";

const paths = [
    path.join(__dirname, "/src/index.js") /* input file(s) path */,
    path.join(__dirname, "/lib") /* output file(s) path */,
];

/* Rollup Configures */
export default {
    /**
     * Specify the bundle's entry point(s) .
     * If you provide an array of entry points or an object mapping names to entry points,
     *    they will be bundled to separate output chunks.
     * PS: it is possible when using the object form to put entry points into different sub-folders by adding a / to the name.
     */
    input: paths[0],
    output: [
        /* 输出 CommonJS 规范的代码 */
        {
            file: path.join(paths[1], "index.js") /* Specify where the file write to. */,
            /**
             * Specify the format of the generated bundle. One of the following:
             * amd – Asynchronous Module Definition, used with module loaders like RequireJS
             * cjs – CommonJS, suitable for Node and other bundlers (alias: commonjs)
             * esm – Keep the bundle as an ES module file,
             *      suitable for other bundlers and inclusion as a <script type=module> tag in modern browsers (alias: esm, module)
             * iife – A self-executing function, suitable for inclusion as a <script> tag.
             *      (If you want to create a bundle for your application, you probably want to use this.)
             * umd – Universal Module Definition, works as amd, cjs and iife all in one
             * system – Native format of the SystemJS loader (alias: systemjs)
             */
            format: "cjs",
            name /* Specify the variable name can be used to access the exports of bundle. */,
        },
        /* 输出 ES module 规范的代码 */
        {
            file: path.join(paths[1], "index.esm.js"),
            format: "esm",
            name,
        },
    ],
    // external: ['lodash'], /* Specify which modules should be treated as external. */
    /**
     * For plugins imported from packages, remember to call the imported plugin function (i.e. commonjs(), not just commonjs).
     */
    plugins: [
        /* Convert CommonJS to ES2015 in order to Rollup can process them. */
        commonjs(),

        /* Teaches Rollup how to find external modules. */
        resolve({
            /* Specify custom options to the resolve plugin. */
            customResolveOptions: {
                moduleDirectory: "node_modules",
            },
        }),

        /* Use Babel in order to use the latest JavaScript features that aren't yet supported by browsers and Node.js. */
        babel({
            babelrc: false /* Specify whether allow Rollup to bypass `.babelrc` file. */,
            presets: [
                [
                    "@babel/preset-env",
                    {
                        /**
                         * Not needed for Babel 7 - it knows automatically that Rollup understands ES modules & that it shouldn't use any module transform with it.
                         * For Babel <6.13, the env preset includes the transform-es2015-modules-commonjs plugin,
                         *    which converts ES6 modules to CommonJS – preventing Rollup from working.
                         * PS: Setting `modules: false` in `.babelrc` which may conflict, to work around this, should specify `babelrc: false` in rollup config
                         */
                        modules: false,
                    },
                ],
            ],
            // externalHelpers: true, /* Specify whether to bundle in the Babel helpers (by default, set to false so babel helpers will be included in your bundle.) */
            runtimeHelpers: true /*  Specify whether use the transform-runtime plugin. */,
            exclude:
                "node_modules/**" /* Specify which files should not by transpiled by Babel (by default, all files are transpiled.) */,
            // extensions: [".ts", ".js", ".jsx", ".es6", ".es", ".mjs"], /* Specify file extensions that Babel should transpile (by default, .js, .jsx, .es6, .es, .mjs are used.) */
        }),

        /* Allow Rollup to import data from a JSON file. */
        json(),
    ],
};
