import { SnapId } from '@metamask/snaps-sdk';
import { Sender } from '@metamask/keyring-api';
import { HandlerType } from '@metamask/snaps-utils';
import { Json, JsonRpcRequest } from '@metamask/utils';
import { handleSnapRequest } from '../../../../ui/store/actions';

export const BITCOIN_MANAGER_SNAP_ID: SnapId =
  'npm:@consensys/bitcoin-manager-snap' as SnapId;
  // Local snap:
  //'local:http://localhost:8080' as SnapId;

export class BitcoinManagerSnapSender implements Sender {
  send = async (request: JsonRpcRequest): Promise<Json> => {
    return (await handleSnapRequest({
      origin: 'metamask',
      snapId: BITCOIN_MANAGER_SNAP_ID,
      handler: HandlerType.OnKeyringRequest,
      request,
    })) as Json;
  };
}
