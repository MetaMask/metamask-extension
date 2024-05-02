import log from 'loglevel';
import { v4 as uuidv4 } from 'uuid';
import type { UserStorage } from '../types/user-storage/user-storage';
import {
  USER_STORAGE_VERSION_KEY,
  USER_STORAGE_VERSION,
} from '../constants/constants';
import {
  TRIGGER_TYPES,
  TRIGGER_TYPES_GROUPS,
  TRIGGERS,
} from '../constants/notification-schema';

export type NotificationTrigger = {
  id: string;
  chainId: string;
  kind: string;
  address: string;
  enabled: boolean;
};

type MapTriggerFn<Result> = (
  trigger: NotificationTrigger,
) => Result | undefined;

type TraverseTriggerOpts<Result> = {
  address?: string;
  mapTrigger?: MapTriggerFn<Result>;
};

/**
 * Extracts and returns the ID from a notification trigger.
 * This utility function is primarily used as a mapping function in `traverseUserStorageTriggers`
 * to convert a full trigger object into its ID string.
 *
 * @param trigger - The notification trigger from which the ID is extracted.
 * @returns The ID of the provided notification trigger.
 */
const triggerToId = (trigger: NotificationTrigger): string => trigger.id;

/**
 * A utility function that returns the input trigger without any transformation.
 * This function is used as the default mapping function in `traverseUserStorageTriggers`
 * when no custom mapping function is provided.
 *
 * @param trigger - The notification trigger to be returned as is.
 * @returns The same notification trigger that was passed in.
 */
const triggerIdentity = (trigger: NotificationTrigger): NotificationTrigger =>
  trigger;

/**
 * Maps a given trigger type to its corresponding trigger group.
 *
 * This method categorizes each trigger type into one of the predefined groups:
 * RECEIVED, SENT, or DEFI. These groups help in organizing triggers based on their nature.
 * For instance, triggers related to receiving assets are categorized under RECEIVED,
 * triggers for sending assets under SENT, and triggers related to decentralized finance (DeFi)
 * operations under DEFI. This categorization aids in managing and responding to different types
 * of notifications more effectively.
 *
 * @param type - The trigger type to be categorized.
 * @returns The group to which the trigger type belongs.
 */
const groupTriggerTypes = (type: TRIGGER_TYPES): TRIGGER_TYPES_GROUPS => {
  switch (type) {
    case TRIGGER_TYPES.ERC20_RECEIVED:
    case TRIGGER_TYPES.ETH_RECEIVED:
    case TRIGGER_TYPES.ERC721_RECEIVED:
    case TRIGGER_TYPES.ERC1155_RECEIVED:
      return TRIGGER_TYPES_GROUPS.RECEIVED;
    case TRIGGER_TYPES.ERC20_SENT:
    case TRIGGER_TYPES.ETH_SENT:
    case TRIGGER_TYPES.ERC721_SENT:
    case TRIGGER_TYPES.ERC1155_SENT:
      return TRIGGER_TYPES_GROUPS.SENT;
    case TRIGGER_TYPES.METAMASK_SWAP_COMPLETED:
    case TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED:
    case TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED:
    case TRIGGER_TYPES.LIDO_STAKE_COMPLETED:
    case TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED:
    case TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED:
    case TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN:
      return TRIGGER_TYPES_GROUPS.DEFI;
    default:
      return TRIGGER_TYPES_GROUPS.DEFI;
  }
};

/**
 * Create a completely new user storage object with the given accounts and state.
 * This method initializes the user storage with a version key and iterates over each account to populate it with triggers.
 * Each trigger is associated with supported chains, and for each chain, a unique identifier (UUID) is generated.
 * The trigger object contains a kind (`k`) indicating the type of trigger and an enabled state (`e`).
 * The kind and enabled state are stored with abbreviated keys to reduce the JSON size.
 *
 * This is used primarily for creating a new user storage (e.g. when first signing in/enabling notification profile syncing),
 * caution is needed in case you need to remove triggers that you don't want (due to notification setting filters)
 *
 * @param accounts - An array of account objects, each optionally containing an address.
 * @param state - A boolean indicating the initial enabled state for all triggers in the user storage.
 * @returns A `UserStorage` object populated with triggers for each account and chain.
 */
export function initializeUserStorage(
  accounts: { address?: string }[],
  state: boolean,
): UserStorage {
  const userStorage: UserStorage = {
    [USER_STORAGE_VERSION_KEY]: USER_STORAGE_VERSION,
  };

  accounts.forEach((account) => {
    const address = account.address?.toLowerCase();
    if (!address) {
      return;
    }
    if (!userStorage[address]) {
      userStorage[address] = {};
    }

    Object.entries(TRIGGERS).forEach(
      ([trigger, { supported_chains: supportedChains }]) => {
        supportedChains.forEach((chain) => {
          if (!userStorage[address]?.[chain]) {
            userStorage[address][chain] = {};
          }

          userStorage[address][chain][uuidv4()] = {
            k: trigger as TRIGGER_TYPES, // use 'k' instead of 'kind' to reduce the json weight
            e: state, // use 'e' instead of 'enabled' to reduce the json weight
          };
        });
      },
    );
  });

  return userStorage;
}

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
export function traverseUserStorageTriggers<
  ResultTriggers = NotificationTrigger,
>(
  userStorage: UserStorage,
  options?: TraverseTriggerOpts<ResultTriggers>,
): ResultTriggers[] {
  const triggers: ResultTriggers[] = [];
  const mapTrigger =
    options?.mapTrigger ?? (triggerIdentity as MapTriggerFn<ResultTriggers>);

  for (const address in userStorage) {
    if (address === (USER_STORAGE_VERSION_KEY as unknown as string)) {
      continue;
    }
    if (options?.address && address !== options.address) {
      continue;
    }

    for (const chainId in userStorage[address]) {
      if (Object.hasOwn(userStorage[address], chainId)) {
        for (const uuid in userStorage[address][chainId]) {
          if (uuid) {
            const mappedTrigger = mapTrigger({
              id: uuid,
              kind: userStorage[address]?.[chainId]?.[uuid]?.k,
              chainId,
              address,
              enabled: userStorage[address]?.[chainId]?.[uuid]?.e ?? false,
            });
            if (mappedTrigger) {
              triggers.push(mappedTrigger);
            }
          }
        }
      }
    }
  }

  return triggers;
}

/**
 * @deprecated - This needs rework for it to be feasible. Currently this is a half-baked solution, as it fails once we add new triggers (introspection for filters is difficult).
 *
 * Checks for the complete presence of trigger types by group across all addresses in the user storage.
 * This method ensures that each address has at least one trigger of each type expected for every group.
 * It leverages `traverseUserStorageTriggers` to iterate over triggers and check their presence.
 * @param userStorage - The user storage object containing notification triggers.
 * @returns A record indicating whether all expected trigger types for each group are present for every address.
 */
export function checkTriggersPresenceByGroup(
  userStorage: UserStorage,
): Record<TRIGGER_TYPES_GROUPS, boolean> {
  // Initialize a record to track the complete presence of triggers for each group
  const completeGroupPresence: Record<TRIGGER_TYPES_GROUPS, boolean> = {
    [TRIGGER_TYPES_GROUPS.RECEIVED]: true,
    [TRIGGER_TYPES_GROUPS.SENT]: true,
    [TRIGGER_TYPES_GROUPS.DEFI]: true,
  };

  // Map to track the required trigger types for each group
  const requiredTriggersByGroup: Record<
    TRIGGER_TYPES_GROUPS,
    Set<TRIGGER_TYPES>
  > = {
    [TRIGGER_TYPES_GROUPS.RECEIVED]: new Set([
      TRIGGER_TYPES.ERC20_RECEIVED,
      TRIGGER_TYPES.ETH_RECEIVED,
      TRIGGER_TYPES.ERC721_RECEIVED,
      TRIGGER_TYPES.ERC1155_RECEIVED,
    ]),
    [TRIGGER_TYPES_GROUPS.SENT]: new Set([
      TRIGGER_TYPES.ERC20_SENT,
      TRIGGER_TYPES.ETH_SENT,
      TRIGGER_TYPES.ERC721_SENT,
      TRIGGER_TYPES.ERC1155_SENT,
    ]),
    [TRIGGER_TYPES_GROUPS.DEFI]: new Set([
      TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
      TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
      TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED,
      TRIGGER_TYPES.LIDO_STAKE_COMPLETED,
      TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
      TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED,
      TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
    ]),
  };

  // Object to keep track of encountered triggers for each group by address
  const encounteredTriggers: Record<
    string,
    Record<TRIGGER_TYPES_GROUPS, Set<TRIGGER_TYPES>>
  > = {};

  // Use traverseUserStorageTriggers to iterate over all triggers
  traverseUserStorageTriggers(userStorage, {
    mapTrigger: (trigger) => {
      const group = groupTriggerTypes(trigger.kind as TRIGGER_TYPES);
      if (!encounteredTriggers[trigger.address]) {
        encounteredTriggers[trigger.address] = {
          [TRIGGER_TYPES_GROUPS.RECEIVED]: new Set(),
          [TRIGGER_TYPES_GROUPS.SENT]: new Set(),
          [TRIGGER_TYPES_GROUPS.DEFI]: new Set(),
        };
      }
      encounteredTriggers[trigger.address][group].add(
        trigger.kind as TRIGGER_TYPES,
      );
      return undefined; // We don't need to transform the trigger, just record its presence
    },
  });

  // Check if all required triggers for each group are present for every address
  Object.keys(encounteredTriggers).forEach((address) => {
    Object.entries(requiredTriggersByGroup).forEach(
      ([group, requiredTriggers]) => {
        const hasAllTriggers = Array.from(requiredTriggers).every(
          (triggerType) =>
            encounteredTriggers[address][group as TRIGGER_TYPES_GROUPS].has(
              triggerType,
            ),
        );
        if (!hasAllTriggers) {
          completeGroupPresence[group as TRIGGER_TYPES_GROUPS] = false;
        }
      },
    );
  });

  return completeGroupPresence;
}

/**
 * Verifies the presence of specified accounts and their chains in the user storage.
 * This method checks if each provided account exists in the user storage and if all its supported chains are present.
 *
 * @param userStorage - The user storage object containing notification triggers.
 * @param accounts - An array of account addresses to check for presence.
 * @returns A record where each key is an account address and each value is a boolean indicating whether the account and all its supported chains are present in the user storage.
 */
export function checkAccountsPresence(
  userStorage: UserStorage,
  accounts: string[],
): Record<string, boolean> {
  const presenceRecord: Record<string, boolean> = {};

  // Initialize presence record for all accounts as false
  accounts.forEach((account) => {
    presenceRecord[account.toLowerCase()] = isAccountEnabled(
      account,
      userStorage,
    );
  });

  return presenceRecord;
}

function isAccountEnabled(
  accountAddress: string,
  userStorage: UserStorage,
): boolean {
  const accountObject = userStorage[accountAddress?.toLowerCase()];

  // If the account address is not present in the userStorage, return true
  if (!accountObject) {
    return false;
  }

  // Check if all available chains are present
  for (const [triggerKind, triggerConfig] of Object.entries(TRIGGERS)) {
    for (const chain of triggerConfig.supported_chains) {
      if (!accountObject[chain]) {
        return false;
      }

      const triggerExists = Object.values(accountObject[chain]).some(
        (obj) => obj.k === triggerKind,
      );
      if (!triggerExists) {
        return false;
      }

      // Check if any trigger is disabled
      for (const uuid in accountObject[chain]) {
        if (!accountObject[chain][uuid].e) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Infers and returns an array of enabled notification trigger kinds from the user storage.
 * This method counts the occurrences of each kind of trigger and returns the kinds that are present.
 *
 * @param userStorage - The user storage object containing notification triggers.
 * @returns An array of trigger kinds (`TRIGGER_TYPES`) that are enabled in the user storage.
 */
export function inferEnabledKinds(userStorage: UserStorage): TRIGGER_TYPES[] {
  const allSupportedKinds = new Set<TRIGGER_TYPES>();

  traverseUserStorageTriggers(userStorage, {
    mapTrigger: (t) => {
      allSupportedKinds.add(t.kind as TRIGGER_TYPES);
    },
  });

  return Array.from(allSupportedKinds);
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
export function getUUIDsForAccount(
  userStorage: UserStorage,
  address: string,
): string[] {
  return traverseUserStorageTriggers(userStorage, {
    address,
    mapTrigger: triggerToId,
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
export function getAllUUIDs(userStorage: UserStorage): string[] {
  return traverseUserStorageTriggers(userStorage, {
    mapTrigger: triggerToId,
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
export function getUUIDsForKinds(
  userStorage: UserStorage,
  allowedKinds: string[],
): string[] {
  const kindsSet = new Set(allowedKinds);

  return traverseUserStorageTriggers(userStorage, {
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
export function getUUIDsForAccountByKinds(
  userStorage: UserStorage,
  address: string,
  allowedKinds: TRIGGER_TYPES[],
): NotificationTrigger[] {
  const allowedKindsSet = new Set(allowedKinds);
  return traverseUserStorageTriggers<NotificationTrigger>(userStorage, {
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
 * @param _account - The account address for which to upsert triggers. The address is normalized to lowercase.
 * @param userStorage - The user storage object to be updated with new or existing triggers.
 * @returns The updated user storage object with upserted triggers for the specified account.
 */
export function upsertAddressTriggers(
  _account: string,
  userStorage: UserStorage,
): UserStorage {
  // Ensure the account exists in userStorage
  const account = _account.toLowerCase();
  userStorage[account] = userStorage[account] || {};

  // Iterate over each trigger and its supported chains
  for (const [trigger, { supported_chains: supportedChains }] of Object.entries(
    TRIGGERS,
  )) {
    for (const chain of supportedChains) {
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
export function upsertTriggerTypeTriggers(
  triggerType: TRIGGER_TYPES,
  userStorage: UserStorage,
): UserStorage {
  // Iterate over each account in userStorage
  Object.entries(userStorage).forEach(([account, chains]) => {
    if (account === (USER_STORAGE_VERSION_KEY as unknown as string)) {
      return;
    }

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
 * @param chainId - The chain ID.
 * @param uuid - The unique identifier for the trigger.
 * @param enabled - The new enabled status.
 * @returns The updated user storage object.
 */
export function toggleUserStorageTriggerStatus(
  userStorage: UserStorage,
  address: string,
  chainId: string,
  uuid: string,
  enabled: boolean,
): UserStorage {
  if (userStorage?.[address]?.[chainId]?.[uuid]) {
    userStorage[address][chainId][uuid].e = enabled;
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
async function fetchWithRetry(
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
 * @param bearerToken - The JSON Web Token for authorization.
 * @param endpoint - The URL of the API endpoint to call.
 * @param method - The HTTP method ('POST' or 'DELETE').
 * @param body - The body of the request. It should be an object that can be serialized to JSON.
 * @param retries - The number of retry attempts in case of failure (default is 3).
 * @param retryDelay - The delay between retries in milliseconds (default is 1000).
 * @returns A Promise that resolves to the response of the fetch request.
 */
export async function makeApiCall<T>(
  bearerToken: string,
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
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(body),
  };

  return fetchWithRetry(endpoint, options, retries, retryDelay);
}
