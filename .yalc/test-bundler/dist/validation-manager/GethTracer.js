"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTracerBodyString = exports.debug_traceTransaction = exports.execAndTrace = exports.debug_traceCall = void 0;
const debug_1 = __importDefault(require("debug"));
const utils_1 = require("ethers/lib/utils");
// from:https://geth.ethereum.org/docs/rpc/ns-debug#javascript-based-tracing
const debug = (0, debug_1.default)('aa.tracer');
// eslint-disable-next-line @typescript-eslint/naming-convention
async function debug_traceCall(provider, tx, options) {
    const tx1 = await (0, utils_1.resolveProperties)(tx);
    const traceOptions = tracer2string(options);
    const ret = await provider.send('debug_traceCall', [tx1, 'latest', traceOptions]).catch(e => {
        var _a;
        debug('ex=', e.error);
        debug('tracer=', (_a = traceOptions.tracer) === null || _a === void 0 ? void 0 : _a.toString().split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n'));
        throw e;
    });
    // return applyTracer(ret, options)
    return ret;
}
exports.debug_traceCall = debug_traceCall;
// a hack for network that doesn't have traceCall: mine the transaction, and use debug_traceTransaction
async function execAndTrace(provider, tx, options) {
    const hash = await provider.getSigner().sendUncheckedTransaction(tx);
    return await debug_traceTransaction(provider, hash, options);
}
exports.execAndTrace = execAndTrace;
// eslint-disable-next-line @typescript-eslint/naming-convention
async function debug_traceTransaction(provider, hash, options) {
    const ret = await provider.send('debug_traceTransaction', [hash, tracer2string(options)]);
    // const tx = await provider.getTransaction(hash)
    // return applyTracer(tx, ret, options)
    return ret;
}
exports.debug_traceTransaction = debug_traceTransaction;
/**
 * extract the body of "LogTracerFunc".
 * note that we extract the javascript body, even if the function was created as typescript
 * @param func
 */
function getTracerBodyString(func) {
    const tracerFunc = func.toString();
    // function must return a plain object:
    //  function xyz() { return {...}; }
    const regexp = /function \w+\s*\(\s*\)\s*{\s*return\s*(\{[\s\S]+\});?\s*\}\s*$/; // (\{[\s\S]+\}); \} $/
    const match = tracerFunc.match(regexp);
    if (match == null) {
        throw new Error('Not a simple method returning value');
    }
    let ret = match[1];
    ret = ret
        // .replace(/\/\/.*\n/g,'\n')
        // .replace(/\n\s*\n/g, '\n')
        .replace(/\b(?:const|let)\b/g, '');
    // console.log('== tracer source',ret.split('\n').map((line,index)=>`${index}: ${line}`).join('\n'))
    return ret;
}
exports.getTracerBodyString = getTracerBodyString;
function tracer2string(options) {
    if (typeof options.tracer === 'function') {
        return Object.assign(Object.assign({}, options), { tracer: getTracerBodyString(options.tracer) });
    }
    else {
        return options;
    }
}
//# sourceMappingURL=GethTracer.js.map