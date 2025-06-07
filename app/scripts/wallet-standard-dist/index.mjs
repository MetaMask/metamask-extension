import { registerWallet } from "@wallet-standard/wallet";
import { MetamaskWallet } from "./wallet.mjs";
export function getWalletStandard(options) {
    return new MetamaskWallet(options);
}
export async function registerSolanaWalletStandard(options) {
    const wallet = getWalletStandard(options);
    registerWallet(wallet);
}
//# sourceMappingURL=index.mjs.map