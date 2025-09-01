import {
  NameProvider,
  NameProviderMetadata,
  NameProviderRequest,
  NameProviderResult,
  NameProviderSourceResult,
  NameType,
} from '@metamask/name-controller';
import { GetPermissionControllerState } from '@metamask/permission-controller';
import {
  AddressLookupArgs,
  AddressLookupResult,
  CaipChainId,
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
import { RestrictedMessenger } from '@metamask/base-controller';
import { getChainIdsCaveat } from '@metamask/snaps-rpc-methods';

type AllowedActions =
  | GetAllSnaps
  | GetSnap
  | HandleSnapRequest
  | GetPermissionControllerState;

export type SnapsNameProviderMessenger = RestrictedMessenger<
  'SnapsNameProvider',
  AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

export class SnapsNameProvider implements NameProvider {
  #messenger: SnapsNameProviderMessenger;

  constructor({ messenger }: { messenger: SnapsNameProviderMessenger }) {
    this.#messenger = messenger;
  }

  getMetadata(): NameProviderMetadata {
    const snaps = this.#getNameLookupSnaps();

    const sourceIds = {
      [NameType.ETHEREUM_ADDRESS]: snaps.map((snap) => snap.id),
    };

    const sourceLabels = snaps.reduce(
      (acc: NameProviderMetadata['sourceLabels'], snap) => {
        const snapDetails = this.#messenger.call('SnapController:get', snap.id);
        const snapName = snapDetails?.manifest.proposedName;

        return {
          ...acc,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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

  async getProposedNames(
    request: NameProviderRequest,
  ): Promise<NameProviderResult> {
    const { variation: chainIdHex, value } = request;
    const caipChainId = `eip155:${parseInt(chainIdHex, 16)}` as CaipChainId;

    const nameSnaps = this.#getNameLookupSnaps(caipChainId);

    const snapResults = await Promise.all(
      nameSnaps.map((snap) =>
        this.#getSnapProposedName(snap.id, caipChainId, value),
      ),
    );

    const results = snapResults.reduce(
      (acc: Record<string, NameProviderSourceResult>, snapResult) => {
        const { sourceId, result } = snapResult;
        return {
          ...acc,
          [sourceId]: result,
        };
      },
      {},
    );

    return { results };
  }

  #getNameLookupSnaps(chainId?: string): TruncatedSnap[] {
    const permissionSubjects = this.#messenger.call(
      'PermissionController:getState',
    ).subjects;

    const snaps = this.#messenger.call('SnapController:getAll');

    return snaps.filter(({ id }) => {
      const permission =
        permissionSubjects[id]?.permissions['endowment:name-lookup'];

      if (!permission) {
        return false;
      }

      const chainIdCaveat = getChainIdsCaveat(permission);

      if (chainId && chainIdCaveat && !chainIdCaveat.includes(chainId)) {
        return false;
      }

      return true;
    });
  }

  async #getSnapProposedName(
    snapId: SnapId,
    caipChainId: CaipChainId,
    address: string,
  ): Promise<{ sourceId: string; result: NameProviderSourceResult }> {
    const sourceId = snapId;

    const nameLookupRequest: AddressLookupArgs = {
      chainId: caipChainId,
      address,
    };

    let proposedNames;
    let resultError;

    try {
      const result = (await this.#messenger.call(
        'SnapController:handleRequest',
        {
          snapId,
          origin: 'metamask',
          handler: HandlerType.OnNameLookup,
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: nameLookupRequest,
          },
        },
      )) as AddressLookupResult;

      const domains = result?.resolvedDomains;

      // TODO: Determine if this is what we want.
      proposedNames = domains
        ? [...new Set(domains.map((domain) => domain.resolvedDomain))]
        : [];
    } catch (error) {
      log.error('Snap name provider request failed', {
        snapId,
        request: nameLookupRequest,
        error,
      });

      resultError = error;
    }

    return {
      sourceId,
      result: {
        proposedNames,
        error: resultError,
      },
    };
  }
}
