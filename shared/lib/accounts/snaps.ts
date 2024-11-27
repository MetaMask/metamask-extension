import { SnapId } from "@metamask/snaps-sdk";
import { BITCOIN_WALLET_SNAP_ID } from "./bitcoin-wallet-snap";
import { SOLANA_WALLET_SNAP_ID } from "./solana-wallet-snap";

/**
 * A constant array that contains the IDs of whitelisted multichain
 * wallet Snaps. These Snaps can be used by the extension to implement
 * core features (e.g. Send flow).
 *
 * @constant
 * @type {string[]}
 */
const WHITELISTED_SNAPS = [BITCOIN_WALLET_SNAP_ID, SOLANA_WALLET_SNAP_ID];

/**
 * Checks if the given Snap ID corresponds to a multichain wallet Snap.
 *
 * @param {SnapId} id - The ID of the Snap to check.
 * @returns {boolean} True if the Snap ID is in the whitelist, false otherwise.
 */
export function isMultichainWalletSnap(id: SnapId): boolean {
  return WHITELISTED_SNAPS.includes(id);
}