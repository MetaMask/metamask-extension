/// <reference types="node" />
import type { Provider } from '@ethersproject/providers';
import type { Signer } from 'ethers';
import type { Express, Response, Request } from 'express';
import type { BundlerConfig } from './BundlerConfig';
import type { DebugMethodHandler } from './DebugMethodHandler';
import type { UserOpMethodHandler } from './UserOpMethodHandler';
import EventEmitter from 'events';
export declare class BundlerServer {
    readonly methodHandler: UserOpMethodHandler;
    readonly debugHandler: DebugMethodHandler;
    readonly config: BundlerConfig;
    readonly provider: Provider;
    readonly wallet: Signer;
    app: Express;
    hub: EventEmitter;
    private readonly httpServer;
    constructor(methodHandler: UserOpMethodHandler, debugHandler: DebugMethodHandler, config: BundlerConfig, provider: Provider, wallet: Signer);
    startingPromise: Promise<void>;
    asyncStart(): Promise<void>;
    stop(): Promise<void>;
    _preflightCheck(): Promise<void>;
    fatal(msg: string): never;
    intro(req: Request, res: Response): void;
    rpc(req: Request, res: Response): Promise<void>;
    handleRpc(reqItem: any): Promise<any>;
    handleMethod(method: string, params: any[]): Promise<any>;
}
