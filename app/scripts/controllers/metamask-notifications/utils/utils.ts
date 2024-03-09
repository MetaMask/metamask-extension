/* eslint-disable camelcase */
import log from 'loglevel';
import { v4 as uuidv4 } from 'uuid';
import type { UserStorage } from '../../user-storage/types/types';
import { USER_STORAGE_VERSION_KEY } from '../../../../../shared/constants/user-storage';
import {
  TRIGGER_TYPES,
  TRIGGERS,
} from '../../../../../shared/constants/platform-notifications';

export type NotificationTrigger = {
  id: string;
  chainId: string;
  kind: string;
  address: string;
};

type MapTriggerFn<Result> = (
  trigger: NotificationTrigger,
) => Result | undefined;

type TraverseTriggerOpts<Result> = {
  address?: string;
  mapTrigger?: MapTriggerFn<Result>;
};

export class PlatformNotificationUtils {
  /**
   * Extracts and returns the ID from a notification trigger.
   * This utility function is primarily used as a mapping function in `traverseUserStorageTriggers`
   * to convert a full trigger object into its ID string.
   *
   * @param trigger - The notification trigger from which the ID is extracted.
   * @returns The ID of the provided notification trigger.
   */
  private triggerToId = (trigger: NotificationTrigger) => trigger.id;

  /**
   * A utility function that returns the input trigger without any transformation.
   * This function is used as the default mapping function in `traverseUserStorageTriggers`
   * when no custom mapping function is provided.
   *
   * @param trigger - The notification trigger to be returned as is.
   * @returns The same notification trigger that was passed in.
   */
  private triggerIdentity = (trigger: NotificationTrigger) => trigger;

  /**
   * Iterates over user storage to find and optionally transform notification triggers.
   * This method allows for flexible retrieval and transformation of triggers based on provided options.
   *
   * @param userStorage - The user storage object containing notification triggers.
   * @param options - Optional parameters to filter and map triggers:
   * - `address`: If provided, only triggers for this address are considered.
   * - `mapTrigger`: A function to transform each trigger. If not provided, triggers are returned as is.
   * @returns An array of triggers, potentially transformed by the `mapTrigger` function.
   */
  public traverseUserStorageTriggers<ResultTriggers = NotificationTrigger>(
    userStorage: UserStorage,
    options?: TraverseTriggerOpts<ResultTriggers>,
  ) {
    const triggers: ResultTriggers[] = [];
    const mapTrigger =
      options?.mapTrigger ??
      (this.triggerIdentity as MapTriggerFn<ResultTriggers>);

    for (const address in userStorage) {
      if (address === (USER_STORAGE_VERSION_KEY as unknown as string)) {
        continue;
      }
      if (options?.address && address !== options.address) {
        continue;
      }
      // eslint-disable-next-line guard-for-in
      for (const chain_id in userStorage[address]) {
        for (const uuid in userStorage[address]?.[chain_id]) {
          if (uuid) {
            const mappedTrigger = mapTrigger({
              id: uuid,
              kind: userStorage[address]?.[chain_id]?.[uuid]?.k,
              chainId: chain_id,
              address,
            });
            if (mappedTrigger) {
              triggers.push(mappedTrigger);
            }
          }
        }
      }
    }

    return triggers;
  }

  /**
   * Infers and returns an array of enabled notification trigger kinds from the user storage.
   * This method counts the occurrences of each kind of trigger and returns the kinds that are present.
   *
   * @param userStorage - The user storage object containing notification triggers.
   * @returns An array of trigger kinds (`TRIGGER_TYPES`) that are enabled in the user storage.
   */
  public inferEnabledKinds(userStorage: UserStorage) {
    const kindsCountObj: Record<string, number> = {};

    this.traverseUserStorageTriggers(userStorage, {
      mapTrigger: (t) => {
        kindsCountObj[t.kind] ??= 0;
        kindsCountObj[t.kind] += 1;
      },
    });

    return Object.keys(kindsCountObj) as TRIGGER_TYPES[];
  }

  /**
   * Retrieves all UUIDs associated with a specific account address from the user storage.
   * This function utilizes `traverseUserStorageTriggers` with a mapping function to extract
   * just the UUIDs of the notification triggers for the given address.
   *
   * @param userStorage - The user storage object containing notification triggers.
   * @param address - The specific account address to retrieve UUIDs for.
   * @returns An array of UUID strings associated with the given account address.
   */
  public getUUIDsForAccount(
    userStorage: UserStorage,
    address: string,
  ): string[] {
    return this.traverseUserStorageTriggers(userStorage, {
      address,
      mapTrigger: this.triggerToId,
    });
  }

  /**
   * Retrieves all UUIDs from the user storage, regardless of the account address or chain ID.
   * This method leverages `traverseUserStorageTriggers` with a specific mapping function (`triggerToId`)
   * to extract only the UUIDs from all notification triggers present in the user storage.
   *
   * @param userStorage - The user storage object containing notification triggers.
   * @returns An array of UUID strings from all notification triggers in the user storage.
   */
  public getAllUUIDs(userStorage: UserStorage): string[] {
    return this.traverseUserStorageTriggers(userStorage, {
      mapTrigger: this.triggerToId,
    });
  }

  /**
   * Retrieves UUIDs for notification triggers that match any of the specified kinds.
   * This method filters triggers based on their kind and returns an array of UUIDs for those that match the allowed kinds.
   * It utilizes `traverseUserStorageTriggers` with a custom mapping function that checks if a trigger's kind is in the allowed list.
   *
   * @param userStorage - The user storage object containing notification triggers.
   * @param allowedKinds - An array of kinds (as strings) to filter the triggers by.
   * @returns An array of UUID strings for triggers that match the allowed kinds.
   */
  public getUUIDsForKinds(userStorage: UserStorage, allowedKinds: string[]) {
    const kindsSet = new Set(allowedKinds);

    return this.traverseUserStorageTriggers(userStorage, {
      mapTrigger: (t) => (kindsSet.has(t.kind) ? t.id : undefined),
    });
  }

  /**
   * Retrieves notification triggers for a specific account address that match any of the specified kinds.
   * This method filters triggers both by the account address and their kind, returning triggers that match the allowed kinds for the specified address.
   * It leverages `traverseUserStorageTriggers` with a custom mapping function to filter and return only the relevant triggers.
   *
   * @param userStorage - The user storage object containing notification triggers.
   * @param address - The specific account address for which to retrieve triggers.
   * @param allowedKinds - An array of trigger kinds (`TRIGGER_TYPES`) to filter the triggers by.
   * @returns An array of `NotificationTrigger` objects that match the allowed kinds for the specified account address.
   */
  public getUUIDsForAccountByKinds(
    userStorage: UserStorage,
    address: string,
    allowedKinds: TRIGGER_TYPES[],
  ): NotificationTrigger[] {
    const allowedKindsSet = new Set(allowedKinds);
    return this.traverseUserStorageTriggers<NotificationTrigger>(userStorage, {
      address,
      mapTrigger: (trigger) => {
        if (allowedKindsSet.has(trigger.kind as TRIGGER_TYPES)) {
          return trigger;
        }
        return undefined;
      },
    });
  }

  /**
   * Upserts (updates or inserts) notification triggers for a given account across all supported chains.
   * This method ensures that each supported trigger type exists for each chain associated with the account.
   * If a trigger type does not exist for a chain, it creates a new trigger with a unique UUID.
   *
   * @param account - The account address for which to upsert triggers. The address is normalized to lowercase.
   * @param userStorage - The user storage object to be updated with new or existing triggers.
   * @returns The updated user storage object with upserted triggers for the specified account.
   */
  public upsertAddressTriggers(
    account: string,
    userStorage: UserStorage,
  ): UserStorage {
    // Ensure the account exists in userStorage
    // eslint-disable-next-line no-param-reassign
    account = account.toLowerCase();
    userStorage[account] = userStorage[account] || {};

    // Iterate over each trigger and its supported chains
    for (const [trigger, { supported_chains }] of Object.entries(TRIGGERS)) {
      for (const chain of supported_chains) {
        // Ensure the chain exists for the account
        userStorage[account][chain] = userStorage[account][chain] || {};

        // Check if the trigger exists for the chain
        const existingTrigger = Object.values(userStorage[account][chain]).find(
          (obj) => obj.k === trigger,
        );

        if (!existingTrigger) {
          // If the trigger doesn't exist, create a new one with a new UUID
          const uuid = uuidv4();
          userStorage[account][chain][uuid] = {
            k: trigger as TRIGGER_TYPES,
            e: false,
          };
        }
      }
    }

    return userStorage;
  }

  /**
   * Upserts (updates or inserts) notification triggers of a specific type across all accounts and chains in user storage.
   * This method ensures that a trigger of the specified type exists for each account and chain. If a trigger of the specified type
   * does not exist for an account and chain, it creates a new trigger with a unique UUID.
   *
   * @param triggerType - The type of trigger to upsert across all accounts and chains.
   * @param userStorage - The user storage object to be updated with new or existing triggers of the specified type.
   * @returns The updated user storage object with upserted triggers of the specified type for all accounts and chains.
   */
  public upsertTriggerTypeTriggers(
    triggerType: TRIGGER_TYPES,
    userStorage: UserStorage,
  ): UserStorage {
    // Iterate over each account in userStorage
    Object.entries(userStorage).forEach(([account, chains]) => {
      // Iterate over each chain for the account
      Object.entries(chains).forEach(([chain, triggers]) => {
        // Check if the trigger type exists for the chain
        const existingTrigger = Object.values(triggers).find(
          (obj) => obj.k === triggerType,
        );

        if (!existingTrigger) {
          // If the trigger type doesn't exist, create a new one with a new UUID
          const uuid = uuidv4();
          userStorage[account][chain][uuid] = {
            k: triggerType,
            e: false,
          };
        }
      });
    });

    return userStorage;
  }

  /**
   * Toggles the enabled status of a user storage trigger.
   *
   * @param userStorage - The user storage object.
   * @param address - The user's address.
   * @param chain_id - The chain ID.
   * @param uuid - The unique identifier for the trigger.
   * @param enabled - The new enabled status.
   * @returns The updated user storage object.
   */
  static toggleUserStorageTriggerStatus(
    userStorage: UserStorage,
    address: string,
    chain_id: string,
    uuid: string,
    enabled: boolean,
  ): UserStorage {
    if (userStorage?.[address]?.[chain_id]?.[uuid]) {
      userStorage[address][chain_id][uuid].e = enabled;
    }

    return userStorage;
  }

  /**
   * Attempts to fetch a resource from the network, retrying the request up to a specified number of times
   * in case of failure, with a delay between attempts.
   *
   * @param url - The resource URL.
   * @param options - The options for the fetch request.
   * @param retries - Maximum number of retry attempts. Defaults to 3.
   * @param retryDelay - Delay between retry attempts in milliseconds. Defaults to 1000.
   * @returns A Promise resolving to the Response object.
   * @throws Will throw an error if the request fails after the specified number of retries.
   */
  static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    retryDelay = 1000,
  ): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }
        return response;
      } catch (error) {
        log.error(`Attempt ${attempt} failed for fetch:`, error);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          throw new Error(
            `Fetching failed after ${retries} retries. Last error: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      }
    }

    throw new Error('Unexpected error in fetchWithRetry');
  }

  /**
   * Performs an API call with automatic retries on failure.
   *
   * @param jwt - The JSON Web Token for authorization.
   * @param endpoint - The URL of the API endpoint to call.
   * @param method - The HTTP method ('POST' or 'DELETE').
   * @param body - The body of the request. It should be an object that can be serialized to JSON.
   * @param retries - The number of retry attempts in case of failure (default is 3).
   * @param retryDelay - The delay between retries in milliseconds (default is 1000).
   * @returns A Promise that resolves to the response of the fetch request.
   */
  static async makeApiCall<T>(
    jwt: string,
    endpoint: string,
    method: 'POST' | 'DELETE',
    body: T,
    retries = 3,
    retryDelay = 1000,
  ): Promise<Response> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    };

    return this.fetchWithRetry(endpoint, options, retries, retryDelay);
  }
}
