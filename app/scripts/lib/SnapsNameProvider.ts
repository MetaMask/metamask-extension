import {
  NameProvider,
  NameProviderMetadata,
  NameProviderRequest,
  NameProviderResult,
  NameProviderSourceResult,
  NameType,
} from '@metamask/name-controller';
import {
  PermissionControllerSubjects,
  PermissionConstraint,
} from '@metamask/permission-controller';
import {
  Snap,
  OnNameLookupArgs,
  HandlerType,
  OnNameLookupResponse,
} from '@metamask/snaps-utils';
import log from 'loglevel';

export type SnapRequest = {
  snapId: string;
  origin: string;
  handler: HandlerType;
  request: any;
};

export class SnapsNameProvider implements NameProvider {
  #getPermissionSubjects: () => PermissionControllerSubjects<PermissionConstraint>;

  #getSnaps: () => Snap[];

  #handleSnapRequest: (request: SnapRequest) => Promise<OnNameLookupResponse>;

  constructor({
    getPermissionSubjects,
    getSnaps,
    handleSnapRequest,
  }: {
    getPermissionSubjects: () => PermissionControllerSubjects<PermissionConstraint>;
    getSnaps: () => Snap[];
    handleSnapRequest: (request: any) => Promise<any>;
  }) {
    this.#getPermissionSubjects = getPermissionSubjects;
    this.#getSnaps = getSnaps;
    this.#handleSnapRequest = handleSnapRequest;
  }

  getMetadata(): NameProviderMetadata {
    const snaps = this.#getNameLookupSnaps();

    const sourceIds = {
      [NameType.ETHEREUM_ADDRESS]: snaps.map((snap) => snap.id),
    };

    const sourceLabels = snaps.reduce(
      (acc: NameProviderMetadata['sourceLabels'], snap) => ({
        ...acc,
        [snap.id]: snap.manifest.proposedName,
      }),
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

  #getNameLookupSnaps(): Snap[] {
    const permissionSubjects = this.#getPermissionSubjects();
    const snaps = this.#getSnaps();

    return snaps.filter(
      ({ id }) => permissionSubjects[id]?.permissions['endowment:name-lookup'],
    );
  }

  async #getSnapProposedName(
    snap: Snap,
    request: NameProviderRequest,
  ): Promise<{ sourceId: string; result: NameProviderSourceResult }> {
    const { chainId: chainIdHex, value } = request;
    const sourceId = snap.id;
    const chainIdDecimal = parseInt(chainIdHex, 16);

    const nameLookupRequest: OnNameLookupArgs = {
      chainId: `eip155:${chainIdDecimal}`,
      address: value,
    };

    let proposedNames;
    let resultError;

    try {
      const result = await this.#handleSnapRequest({
        snapId: snap.id,
        origin: '',
        handler: HandlerType.OnNameLookup,
        request: {
          jsonrpc: '2.0',
          method: ' ',
          params: nameLookupRequest,
        },
      });

      const domain = result?.resolvedDomain;

      proposedNames = domain ? [domain] : [];
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
