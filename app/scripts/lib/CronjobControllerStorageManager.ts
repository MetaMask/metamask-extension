import type { Json } from '@metamask/utils';
import browser from 'webextension-polyfill';
import { captureException } from '../../../shared/lib/sentry';

export const CronjobControllerStorageKey = 'temp-cronjob-storage';
export const CronjobControllerStorageValueKeyPrefix =
  '__metamaskCronjobStorage:';
export const CronjobControllerStoragePointerKeyPrefix =
  '__metamaskCronjobStoragePointer';

const CronjobControllerStoragePointerKeys = [
  `${CronjobControllerStoragePointerKeyPrefix}0`,
  `${CronjobControllerStoragePointerKeyPrefix}1`,
  `${CronjobControllerStoragePointerKeyPrefix}2`,
  `${CronjobControllerStoragePointerKeyPrefix}3`,
  `${CronjobControllerStoragePointerKeyPrefix}4`,
  `${CronjobControllerStoragePointerKeyPrefix}5`,
  `${CronjobControllerStoragePointerKeyPrefix}6`,
  `${CronjobControllerStoragePointerKeyPrefix}7`,
] as const;
const CRONJOB_CONTROLLER_STORAGE_POINTER_VERSION = 1;

type CronjobControllerStoragePointer = {
  version: typeof CRONJOB_CONTROLLER_STORAGE_POINTER_VERSION;
  updatedAt: number;
  storageKey: string;
};

type CronjobControllerStoragePointerState = {
  pointer?: CronjobControllerStoragePointer;
  hasUnreadablePointers: boolean;
};

type CronjobControllerStorageOperation = 'read' | 'write';

type CronjobControllerStorageKeyClass =
  | 'cronjob-legacy-state'
  | 'cronjob-generated-state'
  | 'cronjob-pointer';

function makeStorageKeyId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function makeCronjobStorageValueKey(): string {
  return `${CronjobControllerStorageValueKeyPrefix}${makeStorageKeyId()}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCronjobControllerStoragePointer(
  value: unknown,
): value is CronjobControllerStoragePointer {
  return (
    isObject(value) &&
    value.version === CRONJOB_CONTROLLER_STORAGE_POINTER_VERSION &&
    typeof value.updatedAt === 'number' &&
    typeof value.storageKey === 'string'
  );
}

function captureCronjobStorageError(
  message: string,
  error: unknown,
  storageOperation: CronjobControllerStorageOperation,
  storageKeyClass: CronjobControllerStorageKeyClass,
) {
  captureException(new Error(message, { cause: error }), {
    tags: {
      'persistence.storage_area': 'local',
      'persistence.storage_operation': storageOperation,
      'persistence.storage_key_class': storageKeyClass,
    },
  });
  console.error(message, error);
}

/**
 * A storage manager for CronjobController state.
 *
 * @deprecated This is a temporary fix, please do not use this class (or any
 * similar patterns) elsewhere.
 */
export class CronjobControllerStorageManager {
  /**
   * The initial CronjobController data.
   */
  #initialStorage: Json = null;

  #storageKey: string | null = null;

  #writeQueue: Promise<void> = Promise.resolve();

  /**
   * Whether the storage manager has been initialized or not.
   */
  #initialized = false;

  async #readLatestStoragePointer(): Promise<CronjobControllerStoragePointerState> {
    let hasUnreadablePointers = false;
    const pointers = (
      await Promise.all(
        CronjobControllerStoragePointerKeys.map(async (pointerKey) => {
          try {
            const response = await browser.storage.local.get(pointerKey);
            if (isCronjobControllerStoragePointer(response[pointerKey])) {
              return response[pointerKey];
            }
          } catch (error) {
            hasUnreadablePointers = true;
            captureCronjobStorageError(
              'CronjobControllerStorageManager failed to read storage pointer',
              error,
              'read',
              'cronjob-pointer',
            );
          }
          return undefined;
        }),
      )
    ).filter(
      (pointer): pointer is CronjobControllerStoragePointer =>
        pointer !== undefined,
    );

    return {
      pointer: pointers.reduce<CronjobControllerStoragePointer | undefined>(
        (latest, current) =>
          !latest || current.updatedAt >= latest.updatedAt ? current : latest,
        undefined,
      ),
      hasUnreadablePointers,
    };
  }

  async #readStorageKey(storageKey: string): Promise<Json | undefined> {
    const response = await browser.storage.local.get(storageKey);
    return response[storageKey] as Json | undefined;
  }

  async #readLegacyStorage(): Promise<Json | undefined> {
    try {
      return await this.#readStorageKey(CronjobControllerStorageKey);
    } catch (error) {
      captureCronjobStorageError(
        'CronjobControllerStorageManager failed to read legacy storage',
        error,
        'read',
        'cronjob-legacy-state',
      );
      return undefined;
    }
  }

  async #writeStoragePointers(
    pointer: CronjobControllerStoragePointer,
  ): Promise<boolean> {
    const pointerValues = Object.fromEntries(
      CronjobControllerStoragePointerKeys.map((pointerKey) => [
        pointerKey,
        pointer,
      ]),
    );

    try {
      await browser.storage.local.set(pointerValues);
      return true;
    } catch (error) {
      captureCronjobStorageError(
        'CronjobControllerStorageManager failed to write storage pointers',
        error,
        'write',
        'cronjob-pointer',
      );
    }

    let didWritePointer = false;
    for (const pointerKey of CronjobControllerStoragePointerKeys) {
      try {
        await browser.storage.local.set({ [pointerKey]: pointer });
        didWritePointer = true;
      } catch (error) {
        captureCronjobStorageError(
          'CronjobControllerStorageManager failed to write storage pointer',
          error,
          'write',
          'cronjob-pointer',
        );
      }
    }

    return didWritePointer;
  }

  async #removeStorageKeys(keys: string[]): Promise<void> {
    const uniqueKeys = [...new Set(keys)];
    if (uniqueKeys.length === 0) {
      return;
    }

    for (const key of uniqueKeys) {
      try {
        await browser.storage.local.remove(key);
      } catch (error) {
        captureCronjobStorageError(
          'CronjobControllerStorageManager failed to remove obsolete storage key',
          error,
          'write',
          'cronjob-generated-state',
        );
      }
    }
  }

  /**
   * Initialize the storage manager.
   */
  async init() {
    const { pointer, hasUnreadablePointers } =
      await this.#readLatestStoragePointer();
    if (pointer) {
      try {
        const generatedStorage = await this.#readStorageKey(pointer.storageKey);
        if (typeof generatedStorage !== 'undefined') {
          this.#initialStorage = generatedStorage;
          this.#storageKey = pointer.storageKey;
          this.#initialized = true;
          return;
        }
      } catch (error) {
        captureCronjobStorageError(
          'CronjobControllerStorageManager failed to read generated storage',
          error,
          'read',
          'cronjob-generated-state',
        );
      }
      this.#initialStorage = null;
      this.#storageKey = null;
      this.#initialized = true;
      return;
    }

    if (hasUnreadablePointers) {
      this.#initialStorage = null;
      this.#storageKey = null;
      this.#initialized = true;
      return;
    }

    this.#initialStorage = (await this.#readLegacyStorage()) ?? null;
    this.#storageKey = null;
    this.#initialized = true;
  }

  /**
   * Get the initial CronjobController state.
   *
   * @returns The initial CronjobController state.
   */
  getInitialState() {
    if (!this.#initialized) {
      throw new Error('CronjobControllerStorageManager not yet initialized');
    }
    return this.#initialStorage;
  }

  /**
   * Set the CronjobController state.
   *
   * @param data - The CronjobController state to set.
   */
  set(data: Json) {
    if (!this.#initialized) {
      throw new Error('CronjobControllerStorageManager not yet initialized');
    }
    this.#writeQueue = this.#writeQueue
      .then(() => this.#write(data))
      .catch((error) =>
        captureCronjobStorageError(
          'CronjobControllerStorageManager failed to write generated storage',
          error,
          'write',
          'cronjob-generated-state',
        ),
      );
  }

  async #write(data: Json): Promise<void> {
    const previousStorageKey = this.#storageKey;
    const storageKey = makeCronjobStorageValueKey();

    await browser.storage.local.set({ [storageKey]: data });

    const pointer: CronjobControllerStoragePointer = {
      version: CRONJOB_CONTROLLER_STORAGE_POINTER_VERSION,
      updatedAt: Date.now(),
      storageKey,
    };

    if (await this.#writeStoragePointers(pointer)) {
      this.#initialStorage = data;
      this.#storageKey = storageKey;
      await this.#removeStorageKeys(
        previousStorageKey ? [previousStorageKey] : [],
      );
    }
  }
}
