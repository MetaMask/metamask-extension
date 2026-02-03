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
import { Messenger } from '@metamask/messenger';
import { getChainIdsCaveat } from '@metamask/snaps-rpc-methods';

type AllowedActions =
  | GetAllSnaps
  | GetSnap
  | HandleSnapRequest
  | GetPermissionControllerState;

export type SnapsNameProviderMessenger = Messenger<
  'SnapsNameProvider',
  AllowedActions,
  never
>;

// Cache entry structure
type CacheEntry = {
  result: NameProviderSourceResult;
  timestamp: number;
};

// Pending request structure for deduplication
type PendingRequest = {
  promise: Promise<{ sourceId: string; result: NameProviderSourceResult }>;
  timestamp: number;
};

// Batched request queue structure
type BatchedRequest = {
  snapId: SnapId;
  caipChainId: CaipChainId;
  address: string;
  resolve: (value: {
    sourceId: string;
    result: NameProviderSourceResult;
  }) => void;
  reject: (error: Error) => void;
};

export class SnapsNameProvider implements NameProvider {
  // These fields are required for modular initialisation.
  name: 'SnapsNameProvider' = 'SnapsNameProvider' as const;

  state = null;

  #messenger: SnapsNameProviderMessenger;

  // Cache for name lookup results
  #cache: Map<string, CacheEntry> = new Map();

  // Cache TTL in milliseconds (60 seconds)
  #cacheTTL = 60000;

  // Maximum cache size
  #maxCacheSize = 500;

  // Pending requests for deduplication
  #pendingRequests: Map<string, PendingRequest> = new Map();

  // Batch queue and timer
  #batchQueue: BatchedRequest[] = [];

  #batchTimer: NodeJS.Timeout | null = null;

  // Batch delay in milliseconds (50ms to collect multiple requests)
  #batchDelay = 50;

  // Maximum batch size
  #maxBatchSize = 10;

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

  /**
   * Generate cache key for a request
   */
  #getCacheKey(snapId: SnapId, caipChainId: CaipChainId, address: string): string {
    return `${snapId}:${caipChainId}:${address.toLowerCase()}`;
  }

  /**
   * Get result from cache if available and not expired
   */
  #getFromCache(
    snapId: SnapId,
    caipChainId: CaipChainId,
    address: string,
  ): NameProviderSourceResult | null {
    const key = this.#getCacheKey(snapId, caipChainId, address);
    const cached = this.#cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.#cacheTTL) {
      return cached.result;
    }

    // Remove expired entry
    if (cached) {
      this.#cache.delete(key);
    }

    return null;
  }

  /**
   * Store result in cache
   */
  #storeInCache(
    snapId: SnapId,
    caipChainId: CaipChainId,
    address: string,
    result: NameProviderSourceResult,
  ): void {
    // Enforce max cache size
    if (this.#cache.size >= this.#maxCacheSize) {
      // Remove oldest entries (first 10% of cache)
      const entriesToRemove = Math.floor(this.#maxCacheSize * 0.1);
      const keysToRemove = Array.from(this.#cache.keys()).slice(0, entriesToRemove);
      keysToRemove.forEach((key) => this.#cache.delete(key));
    }

    const key = this.#getCacheKey(snapId, caipChainId, address);
    this.#cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Get pending request key for deduplication
   */
  #getPendingKey(
    snapId: SnapId,
    caipChainId: CaipChainId,
    address: string,
  ): string {
    return this.#getCacheKey(snapId, caipChainId, address);
  }

  /**
   * Process a batch of requests
   */
  #processBatch(): void {
    if (this.#batchQueue.length === 0) {
      return;
    }

    // Take all requests from the queue
    const requests = this.#batchQueue.splice(0, this.#batchQueue.length);

    // Group requests by snap and chain to optimize parallel execution
    const groupedRequests = new Map<string, BatchedRequest[]>();
    
    requests.forEach((request) => {
      const groupKey = `${request.snapId}:${request.caipChainId}`;
      if (!groupedRequests.has(groupKey)) {
        groupedRequests.set(groupKey, []);
      }
      groupedRequests.get(groupKey)!.push(request);
    });

    // Process each group in parallel
    Array.from(groupedRequests.values()).forEach((group) => {
      // Process requests within group sequentially to avoid overwhelming the snap
      this.#processRequestGroup(group);
    });
  }

  /**
   * Process a group of requests sequentially
   */
  async #processRequestGroup(requests: BatchedRequest[]): Promise<void> {
    for (const request of requests) {
      try {
        const result = await this.#executeSnapRequest(
          request.snapId,
          request.caipChainId,
          request.address,
        );
        request.resolve(result);
      } catch (error) {
        request.reject(error as Error);
      }
    }
  }

  /**
   * Execute the actual snap request
   */
  async #executeSnapRequest(
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

    const resultValue = {
      sourceId,
      result: {
        proposedNames,
        error: resultError,
      },
    };

    // Store in cache
    this.#storeInCache(snapId, caipChainId, address, resultValue.result);

    return resultValue;
  }

  async getProposedNames(
    request: NameProviderRequest,
  ): Promise<NameProviderResult> {
    const { variation: chainIdHex, value } = request;
    const caipChainId = `eip155:${parseInt(chainIdHex, 16)}` as CaipChainId;

    const nameSnaps = this.#getNameLookupSnaps(caipChainId);

    const snapResults = await Promise.all(
      nameSnaps.map((snap) =>
        this.#getSnapProposedNameWithCaching(snap.id, caipChainId, value),
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

  /**
   * Get snap proposed name with caching and batching
   */
  async #getSnapProposedNameWithCaching(
    snapId: SnapId,
    caipChainId: CaipChainId,
    address: string,
  ): Promise<{ sourceId: string; result: NameProviderSourceResult }> {
    // Check cache first
    const cachedResult = this.#getFromCache(snapId, caipChainId, address);
    if (cachedResult) {
      return {
        sourceId: snapId,
        result: cachedResult,
      };
    }

    // Check if there's already a pending request for this address
    const pendingKey = this.#getPendingKey(snapId, caipChainId, address);
    const existingRequest = this.#pendingRequests.get(pendingKey);

    if (existingRequest) {
      // Return the existing promise to avoid duplicate requests
      return existingRequest.promise;
    }

    // Create a new request promise
    const requestPromise = new Promise<{
      sourceId: string;
      result: NameProviderSourceResult;
    }>(async (resolve, reject) => {
      // Add to batch queue
      this.#batchQueue.push({
        snapId,
        caipChainId,
        address,
        resolve,
        reject,
      });

      // If batch is full, process immediately
      if (this.#batchQueue.length >= this.#maxBatchSize) {
        if (this.#batchTimer) {
          clearTimeout(this.#batchTimer);
          this.#batchTimer = null;
        }
        this.#processBatch();
      } else {
        // Schedule batch processing
        if (!this.#batchTimer) {
          this.#batchTimer = setTimeout(() => {
            this.#batchTimer = null;
            this.#processBatch();
          }, this.#batchDelay);
        }
      }
    });

    // Store the pending request
    this.#pendingRequests.set(pendingKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    });

    // Clean up after completion
    requestPromise
      .finally(() => {
        this.#pendingRequests.delete(pendingKey);
      })
      .catch(() => {
        // Error already handled in the promise
      });

    return requestPromise;
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
}
