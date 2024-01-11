import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { Initializable, InitializableInterface } from "../../../../../@openzeppelin/contracts/proxy/utils/Initializable";
export declare class Initializable__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint8";
            readonly name: "version";
            readonly type: "uint8";
        }];
        readonly name: "Initialized";
        readonly type: "event";
    }];
    static createInterface(): InitializableInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Initializable;
}
