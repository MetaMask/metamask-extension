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

type AllowedActions =
  | GetAllSnaps
  | GetSnap
  | HandleSnapRequest
  | GetPermissionControllerState;

export type SnapsNameProviderMessenger = RestrictedControllerMessenger<
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
    const nameSnaps = this.#getNameLookupSnaps();

    const snapResults = await Promise.all(
      nameSnaps.map((snap) => this.#getSnapProposedName(snap, request)),
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

  #getNameLookupSnaps(): TruncatedSnap[] {
    const permissionSubjects = this.#messenger.call(
      'PermissionController:getState',
    ).subjects;

    const snaps = this.#messenger.call('SnapController:getAll');

    return snaps.filter(
      ({ id }) => permissionSubjects[id]?.permissions['endowment:name-lookup'],
    );
  }

  async #getSnapProposedName(
    snap: TruncatedSnap,
    request: NameProviderRequest,
  ): Promise<{ sourceId: string; result: NameProviderSourceResult }> {
    const { variation: chainIdHex, value } = request;
    const sourceId = snap.id;
    const chainIdDecimal = parseInt(chainIdHex, 16);

    const nameLookupRequest: AddressLookupArgs = {
      chainId: `eip155:${chainIdDecimal}`,
      address: value,
    };

    let proposedNames;
    let resultError;

    try {
      const result = (await this.#messenger.call(
        'SnapController:handleRequest',
        {
          snapId: snap.id,
          origin: '',
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
        snapId: snap.id,
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
