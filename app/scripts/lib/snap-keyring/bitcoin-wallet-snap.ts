import { SnapId } from '@metamask/snaps-sdk';
import { Sender } from '@metamask/keyring-api';
import { HandlerType } from '@metamask/snaps-utils';
import { Json, JsonRpcRequest } from '@metamask/utils';
// This dependency is still installed as part of the `package.json`, however
// the Snap is being pre-installed only for Flask build (for the moment).
import BitcoinWalletSnap from '@metamask/bitcoin-wallet-snap/dist/preinstalled-snap.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { handleSnapRequest } from '../../../../ui/store/actions';

// export const BITCOIN_WALLET_SNAP_ID: SnapId = 'local:http://localhost:8080';
export const BITCOIN_WALLET_SNAP_ID: SnapId =
  BitcoinWalletSnap.snapId as SnapId;

export const BITCOIN_WALLET_NAME: string =
  BitcoinWalletSnap.manifest.proposedName;

export class BitcoinWalletSnapSender implements Sender {
  send = async (request: JsonRpcRequest): Promise<Json> => {
    // We assume the caller of this module is aware of this. If we try to use this module
    // without having the pre-installed Snap, this will likely throw an error in
    // the `handleSnapRequest` action.
    return (await handleSnapRequest({
      origin: 'metamask',
      snapId: BITCOIN_WALLET_SNAP_ID,
      handler: HandlerType.OnKeyringRequest,
      request,
    })) as Json;
  };
}
