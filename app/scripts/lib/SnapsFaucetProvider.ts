import { GetPermissionControllerState } from '@metamask/permission-controller';
import {
  SnapId,
  Snap as TruncatedSnap,
} from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import log from 'loglevel';
import {
  GetAllSnaps,
  GetSnap,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { FaucetProvider, FaucetProviderMetadata, FaucetProviderRequest, FaucetProviderSourceResult } from '../controllers/faucets/faucet';
import { CHAIN_IDS } from '../../../shared/constants/network';

// HARCODED SNAP ID
// We need to find a way to get this snap id dynamically.
// The name provider snaps have its own endowment - maybe that is what we need,
// but it is a stretch for the hackathon time frame
const snapId = 'local:http://localhost:8080' as SnapId;

type AllowedActions =
  | GetAllSnaps
  | GetSnap
  | HandleSnapRequest
  | GetPermissionControllerState;

export type SnapsFaucetProviderMessenger = RestrictedControllerMessenger<
  'SnapsFaucetProvider',
  AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

export class SnapsFaucetProvider implements FaucetProvider {
  #messenger: SnapsFaucetProviderMessenger;

  constructor({ messenger }: { messenger: SnapsFaucetProviderMessenger }) {
    this.#messenger = messenger;
  }

  getMetadata(): FaucetProviderMetadata {
    const snaps = this.#getFaucetLookupSnaps();

    const sourceIds = {
      [CHAIN_IDS.SEPOLIA]: snaps.map((snap) => snap.id),
    };

    const sourceLabels = snaps.reduce(
      (acc: FaucetProviderMetadata['sourceLabels'], snap) => {
        const snapDetails = this.#messenger.call('SnapController:get', snap.id);
        const snapName = snapDetails?.manifest.proposedName;

        return {
          ...acc,
          [snap.id]: snapName || snap.id,
        };
      },
      {},
    );

    return {
      sourceIds,
      sourceLabels,
    };
  }

  async sendETH(
    request: FaucetProviderRequest,
  ): Promise<FaucetProviderSourceResult> {
    const faucetSnap = this.#messenger.call('SnapController:get', request.sourceId);

    if (!faucetSnap) {
      throw new Error('Faucet snap not found');
    };

    return await this.#getSnapSendEth(faucetSnap, request);
  }

  #getFaucetLookupSnaps(): TruncatedSnap[] {
    const snap = this.#messenger.call('SnapController:get', snapId);

    return snap ? [snap] : [];
  }

  async #getSnapSendEth(
    snap: TruncatedSnap,
    request: Omit<FaucetProviderRequest, 'sourceId'>,
  ): Promise<FaucetProviderSourceResult> {
    const { chainId: chainIdHex, address } = request;

    let txHash;
    let resultError;

    try {
      const result = (await this.#messenger.call(
        'SnapController:handleRequest',
        {
          snapId: snap.id,
          origin: 'metamask',
          handler: HandlerType.OnRpcRequest,
          request: {
            jsonrpc: '2.0',
            method: 'sendETH',
            params: { chainIdHex, address },
          },
        },
      )) as { txHash: string } | null;

      txHash = result?.txHash;
    } catch (error) {
      log.error('Snap faucet provider request failed', {
        snapId: snap.id,
        request: { chainIdHex, address },
        error,
      });

      resultError = error;
    }

    return {
      txHash,
      error: resultError,
    };
  }
}
