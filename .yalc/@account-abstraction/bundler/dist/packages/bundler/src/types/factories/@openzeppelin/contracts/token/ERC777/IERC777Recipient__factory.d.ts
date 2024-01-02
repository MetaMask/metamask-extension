import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { IERC777Recipient, IERC777RecipientInterface } from "../../../../../@openzeppelin/contracts/token/ERC777/IERC777Recipient";
export declare class IERC777Recipient__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "userData";
            readonly type: "bytes";
        }, {
            readonly internalType: "bytes";
            readonly name: "operatorData";
            readonly type: "bytes";
        }];
        readonly name: "tokensReceived";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): IERC777RecipientInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC777Recipient;
}
