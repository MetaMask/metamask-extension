import { SnapId } from '@metamask/snaps-sdk';
import { Sender } from '@metamask/keyring-api';
import { HandlerType } from '@metamask/snaps-utils';
import { Json, JsonRpcRequest } from '@metamask/utils';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import BitcoinWalletSnap from '@metamask/bitcoin-wallet-snap/dist/preinstalled-snap.json';
///: END:ONLY_INCLUDE_IF
import { handleSnapRequest } from '../../../../ui/store/actions';

export const BITCOIN_WALLET_SNAP_ID: SnapId =
  BitcoinWalletSnap.snapId as SnapId;

export class BitcoinWalletSnapSender implements Sender {
  send = async (request: JsonRpcRequest): Promise<Json> => {
    return (await handleSnapRequest({
      origin: 'metamask',
      snapId: BITCOIN_WALLET_SNAP_ID,
      handler: HandlerType.OnKeyringRequest,
      request,
    })) as Json;
  };
}
