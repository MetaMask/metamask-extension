import { TRIGGER_TYPES } from '../constants/notification-schema';
import { USER_STORAGE_VERSION_KEY } from '../constants/constants';
import { UserStorage } from '../types/user-storage/user-storage';
import { initializeUserStorage } from '../utils/utils';

export const MOCK_USER_STORAGE_ACCOUNT =
  '0x0000000000000000000000000000000000000000';
export const MOCK_USER_STORAGE_CHAIN = '1';

export function createMockUserStorage(
  override?: Partial<UserStorage>,
): UserStorage {
  return {
    [USER_STORAGE_VERSION_KEY]: '1',
    [MOCK_USER_STORAGE_ACCOUNT]: {
      [MOCK_USER_STORAGE_CHAIN]: {
        '111-111-111-111': {
          k: TRIGGER_TYPES.ERC20_RECEIVED,
          e: true,
        },
        '222-222-222-222': {
          k: TRIGGER_TYPES.ERC20_SENT,
          e: true,
        },
      },
    },
    ...override,
  };
}

export function createMockUserStorageWithTriggers(
  triggers: string[] | { id: string; e: boolean; k?: TRIGGER_TYPES }[],
): UserStorage {
  const userStorage: UserStorage = {
    [USER_STORAGE_VERSION_KEY]: '1',
    [MOCK_USER_STORAGE_ACCOUNT]: {
      [MOCK_USER_STORAGE_CHAIN]: {},
    },
  };

  // insert triggerIds
  triggers.forEach((t) => {
    let tId: string;
    let e: boolean;
    let k: TRIGGER_TYPES;
    if (typeof t === 'string') {
      tId = t;
      e = true;
      k = TRIGGER_TYPES.ERC20_RECEIVED;
    } else {
      tId = t.id;
      e = t.e;
      k = t.k ?? TRIGGER_TYPES.ERC20_RECEIVED;
    }

    userStorage[MOCK_USER_STORAGE_ACCOUNT][MOCK_USER_STORAGE_CHAIN][tId] = {
      k,
      e,
    };
  });

  return userStorage;
}

export function createMockFullUserStorage(
  props: { triggersEnabled?: boolean } = {},
): UserStorage {
  return initializeUserStorage(
    [{ address: MOCK_USER_STORAGE_ACCOUNT }],
    props.triggersEnabled ?? true,
  );
}
