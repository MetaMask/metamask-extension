import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC1822Proxiable, IERC1822ProxiableInterface } from "../../../../../@openzeppelin/contracts/interfaces/draft-IERC1822.sol/IERC1822Proxiable";
export declare class IERC1822Proxiable__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "proxiableUUID";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): IERC1822ProxiableInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC1822Proxiable;
}
