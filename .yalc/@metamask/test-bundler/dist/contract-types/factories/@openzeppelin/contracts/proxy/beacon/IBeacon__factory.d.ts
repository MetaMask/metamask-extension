import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IBeacon, IBeaconInterface } from "../../../../../@openzeppelin/contracts/proxy/beacon/IBeacon";
export declare class IBeacon__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "implementation";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): IBeaconInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IBeacon;
}
