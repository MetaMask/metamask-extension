"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runBundler_1 = require("./runBundler");
void (0, runBundler_1.runBundler)(process.argv)
    .catch(e => {
    console.error('Aborted:', runBundler_1.showStackTraces ? e : e.message);
    process.exit(1);
});
//# sourceMappingURL=exec.js.map