/// <reference types="node" />
import type { Deferrable } from '@ethersproject/properties';
import type { JsonRpcProvider, TransactionRequest } from '@ethersproject/providers';
import type { BigNumber } from 'ethers';
/**
 * a function returning a LogTracer.
 * the function's body must be "{ return {...} }"
 * the body is executed as "geth" tracer, and thus must be self-contained (no external functions or references)
 * may only reference external functions defined by geth (see go-ethereum/eth/tracers/js): toHex, toWord, isPrecompiled, slice, toString(16)
 * (it is OK if original function was in typescript: we extract its value as javascript
 */
type LogTracerFunc = () => LogTracer;
/**
 *
 * @param provider
 * @param tx
 * @param options
 */
export declare function debug_traceCall(provider: JsonRpcProvider, tx: Deferrable<TransactionRequest>, options: TraceOptions): Promise<TraceResult | any>;
/**
 *
 * @param provider
 * @param tx
 * @param options
 */
export declare function execAndTrace(provider: JsonRpcProvider, tx: Deferrable<TransactionRequest>, options: TraceOptions): Promise<TraceResult | any>;
/**
 *
 * @param provider
 * @param hash
 * @param options
 */
export declare function debug_traceTransaction(provider: JsonRpcProvider, hash: string, options: TraceOptions): Promise<TraceResult | any>;
/**
 * extract the body of "LogTracerFunc".
 * note that we extract the javascript body, even if the function was created as typescript
 * @param func
 */
export declare function getTracerBodyString(func: LogTracerFunc): string;
export type TraceOptions = {
    disableStorage?: boolean;
    disableStack?: boolean;
    enableMemory?: boolean;
    enableReturnData?: boolean;
    tracer?: LogTracerFunc | string;
    timeout?: string;
};
export type TraceResult = {
    gas: number;
    returnValue: string;
    structLogs: [TraceResultEntry];
};
export type TraceResultEntry = {
    depth: number;
    error: string;
    gas: number;
    gasCost: number;
    memory?: [string];
    op: string;
    pc: number;
    stack: [string];
    storage?: [string];
};
export type LogContext = {
    type: string;
    from: string;
    to: string;
    input: Buffer;
    gas: number;
    gasUsed: number;
    gasPrice: number;
    intrinsicGas: number;
    value: BigNumber;
    block: number;
    output: Buffer;
    time: string;
    blockHash?: Buffer;
    txIndex?: number;
    txHash?: Buffer;
};
export type LogTracer = {
    result: (ctx: LogContext, db: LogDb) => any;
    fault: (log: LogStep, db: LogDb) => void;
    setup?: (config: any) => any;
    step?: (log: LogStep, db: LogDb) => any;
    enter?: (frame: LogCallFrame) => void;
    exit?: (frame: LogFrameResult) => void;
};
export type LogCallFrame = {
    getType: () => string;
    getFrom: () => string;
    getTo: () => string;
    getInput: () => string;
    getGas: () => number;
    getValue: () => BigNumber;
};
export type LogFrameResult = {
    getGasUsed: () => number;
    getOutput: () => Buffer;
    getError: () => any;
};
export type LogOpCode = {
    isPush: () => boolean;
    toString: () => string;
    toNumber: () => number;
};
export type LogMemory = {
    slice: (start: number, stop: number) => any;
    getUint: (offset: number) => any;
    length: () => number;
};
export type LogStack = {
    peek: (idx: number) => any;
    length: () => number;
};
export type LogContract = {
    getCaller: () => any;
    getAddress: () => string;
    getValue: () => BigNumber;
    getInput: () => any;
};
export type LogStep = {
    op: LogOpCode;
    stack: LogStack;
    memory: LogMemory;
    contract: LogContract;
    getPC: () => number;
    getGas: () => number;
    getCost: () => number;
    getDepth: () => number;
    getRefund: () => number;
    getError: () => string | undefined;
};
export type LogDb = {
    getBalance: (address: string) => BigNumber;
    getNonce: (address: string) => number;
    getCode: (address: string) => any;
    getState: (address: string, hash: string) => any;
    exists: (address: string) => boolean;
};
export {};
