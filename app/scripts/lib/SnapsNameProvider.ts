import {
  NameProvider,
  NameProviderMetadata,
  NameProviderRequest,
  NameProviderResult,
  NameProviderSourceResult,
  NameType,
} from '@metamask/name-controller';
import { Snap } from '@metamask/snaps-utils';

export class SnapsNameProvider implements NameProvider {
  #getSnaps: () => Snap[];

  #handleSnapRequest: (request: any) => Promise<any>;

  constructor({
    getSnaps,
    handleSnapRequest,
  }: {
    getSnaps: () => Snap[];
    handleSnapRequest: (request: any) => Promise<any>;
  }) {
    this.#getSnaps = getSnaps;
    this.#handleSnapRequest = handleSnapRequest;
  }

  getMetadata(): NameProviderMetadata {
    const snaps = this.#getSnaps();

    const sourceIds = {
      [NameType.ETHEREUM_ADDRESS]: snaps.map((snap) => snap.id),
    };

    const sourceLabels = snaps.reduce(
      (acc: NameProviderMetadata['sourceLabels'], snap) => {
        acc[snap.id] = snap.manifest.proposedName;
        return acc;
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
    const snaps = this.#getSnaps();

    const snapResults = await Promise.all(
      snaps.map((snap) => this.#getSnapProposedName(snap, request)),
    );

    const results = snapResults.reduce(
      (acc: Record<string, NameProviderSourceResult>, snapResult) => {
        const { sourceId, result } = snapResult;
        acc[sourceId] = result;
        return acc;
      },
      {},
    );

    return { results };
  }

  async #getSnapProposedName(
    snap: Snap,
    request: NameProviderRequest,
  ): Promise<{ sourceId: string; result: NameProviderSourceResult }> {
    const { chainId, value } = request;
    const sourceId = snap.id;

    let proposedNames;
    let resultError;

    try {
      const result = await this.#handleSnapRequest({
        snapId: snap.id,
        origin: '',
        handler: 'onRpcRequest',
        request: {
          jsonrpc: '2.0',
          method: ' ',
          params: {
            address: value,
            chainId,
          },
        },
      });

      proposedNames = [result?.resolvedAccount];
    } catch (error) {
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
