import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { INonceManager, INonceManagerInterface } from "../../../../@account-abstraction/contracts/interfaces/INonceManager";
export declare class INonceManager__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "sender";
            readonly type: "address";
        }, {
            readonly internalType: "uint192";
            readonly name: "key";
            readonly type: "uint192";
        }];
        readonly name: "getNonce";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "nonce";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint192";
            readonly name: "key";
            readonly type: "uint192";
        }];
        readonly name: "incrementNonce";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): INonceManagerInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): INonceManager;
}
