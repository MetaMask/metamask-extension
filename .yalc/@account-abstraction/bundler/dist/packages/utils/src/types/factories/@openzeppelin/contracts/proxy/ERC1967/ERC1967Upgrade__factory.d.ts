import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ERC1967Upgrade, ERC1967UpgradeInterface } from "../../../../../@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade";
export declare class ERC1967Upgrade__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "previousAdmin";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "newAdmin";
            readonly type: "address";
        }];
        readonly name: "AdminChanged";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "beacon";
            readonly type: "address";
        }];
        readonly name: "BeaconUpgraded";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "implementation";
            readonly type: "address";
        }];
        readonly name: "Upgraded";
        readonly type: "event";
    }];
    static createInterface(): ERC1967UpgradeInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC1967Upgrade;
}
