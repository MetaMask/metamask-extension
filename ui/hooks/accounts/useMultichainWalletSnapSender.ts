import type { Sender } from '@metamask/keyring-snap-client';
import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import type { Json, JsonRpcRequest } from '@metamask/utils';
import { useMemo } from 'react';
import { handleSnapRequest } from '../../store/actions';

export class MultichainWalletSnapSender implements Sender {
  readonly #snapId: SnapId;

  constructor(snapId: SnapId) {
    this.#snapId = snapId;
  }

  send = async (request: JsonRpcRequest): Promise<Json> => {
    // We assume the caller is aware that the pre-installed Snap must exist.
    return (await handleSnapRequest({
      origin: 'metamask',
      snapId: this.#snapId,
      handler: HandlerType.OnKeyringRequest,
      request,
    })) as Json;
  };
}

export function useMultichainWalletSnapSender(snapId: SnapId) {
  return useMemo(() => {
    return new MultichainWalletSnapSender(snapId);
  }, [snapId]);
}
