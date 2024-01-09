"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runBundler_1 = require("./runBundler");
process.on('SIGINT', () => {
    process.exit(0);
});
process.on('SIGTERM', () => {
    process.exit(0);
});
void (0, runBundler_1.runBundler)(process.argv).then((bundler) => {
    process.on('exit', () => {
        void bundler.stop();
    });
})
    .catch(e => {
    console.error('Aborted:', runBundler_1.showStackTraces ? e : e.message);
    process.exit(1);
});
//# sourceMappingURL=exec.js.map