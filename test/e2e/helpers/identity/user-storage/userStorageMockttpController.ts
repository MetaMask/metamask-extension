import { EventEmitter } from 'events';
import { CompletedRequest, Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { MOCK_SRP_E2E_IDENTIFIER_BASE_KEY } from '../../../tests/identity/mocks';

const baseUrl =
  'https://user-storage\\.api\\.cx\\.metamask\\.io\\/api\\/v1\\/userstorage';

export const pathRegexps = {
  [USER_STORAGE_FEATURE_NAMES.accounts]: new RegExp(
    `${baseUrl}/${USER_STORAGE_FEATURE_NAMES.accounts}`,
    'u',
  ),
  [USER_STORAGE_FEATURE_NAMES.networks]: new RegExp(
    `${baseUrl}/${USER_STORAGE_FEATURE_NAMES.networks}`,
    'u',
  ),
  [USER_STORAGE_FEATURE_NAMES.notifications]: new RegExp(
    `${baseUrl}/${USER_STORAGE_FEATURE_NAMES.notifications}`,
    'u',
  ),
  [USER_STORAGE_FEATURE_NAMES.addressBook]: new RegExp(
    `${baseUrl}/${USER_STORAGE_FEATURE_NAMES.addressBook}`,
    'u',
  ),
};

export type UserStorageResponseData = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  HashedKey: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Data: string;
  // E2E Specific identifier that is not present in the real API
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SrpIdentifier?: string;
};

export const UserStorageMockttpControllerEvents = {
  GET_NOT_FOUND: 'GET_NOT_FOUND',
  GET_SINGLE: 'GET_SINGLE',
  GET_ALL: 'GET_ALL',
  PUT_SINGLE: 'PUT_SINGLE',
  PUT_BATCH: 'PUT_BATCH',
  DELETE_NOT_FOUND: 'DELETE_NOT_FOUND',
  DELETE_SINGLE: 'DELETE_SINGLE',
  DELETE_ALL: 'DELETE_ALL',
  DELETE_BATCH_NOT_FOUND: 'DELETE_BATCH_NOT_FOUND',
  DELETE_BATCH: 'DELETE_BATCH',
} as const;

// Helper type for converting const objects to enum-like types
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type AsEnum<T> = T[keyof T];

const determineIfFeatureEntryFromURL = (url: string) =>
  url.substring(url.lastIndexOf('userstorage') + 12).split('/').length === 2;

const getSrpIdentifierFromHeaders = (headers: Record<string, unknown>) => {
  const authHeader = headers.authorization;
  return (
    authHeader?.toString()?.split(' ')[1] ||
    `${MOCK_SRP_E2E_IDENTIFIER_BASE_KEY}_1`
  );
};

export class UserStorageMockttpController {
  paths: Map<
    keyof typeof pathRegexps,
    {
      response: UserStorageResponseData[];
      server: Mockttp;
    }
  > = new Map();

  eventEmitter: EventEmitter = new EventEmitter();

  readonly onGet = async (
    path: keyof typeof pathRegexps,
    request: Pick<CompletedRequest, 'path' | 'headers'>,
    statusCode: number = 200,
  ) => {
    const srpIdentifier = getSrpIdentifierFromHeaders(request.headers);
    const internalPathData = this.paths.get(path);

    if (!internalPathData) {
      this.eventEmitter.emit(UserStorageMockttpControllerEvents.GET_NOT_FOUND, {
        path,
        statusCode,
      });

      return {
        statusCode,
        json: null,
      };
    }

    const isFeatureEntry = determineIfFeatureEntryFromURL(request.path);

    // If the request is for a single entry, we don't need to check the SRP identifier
    // because the entry is already identified by the path
    if (isFeatureEntry) {
      const json =
        internalPathData.response?.find(
          (entry) => entry.HashedKey === request.path.split('/').pop(),
        ) || null;

      this.eventEmitter.emit(UserStorageMockttpControllerEvents.GET_SINGLE, {
        path,
        statusCode,
      });

      return {
        statusCode,
        json,
      };
    }

    // If the request is for all entries, we need to check the SRP identifier
    // in order to return only the entries that belong to the user
    const json = internalPathData?.response.length
      ? internalPathData.response
      : null;

    const filteredJson = json?.filter((entry) => {
      return entry.SrpIdentifier === srpIdentifier;
    });
    const jsonToReturn = filteredJson?.length ? filteredJson : null;

    this.eventEmitter.emit(UserStorageMockttpControllerEvents.GET_ALL, {
      path,
      statusCode,
    });

    return {
      statusCode,
      json: jsonToReturn,
    };
  };

  readonly onPut = async (
    path: keyof typeof pathRegexps,
    request: Pick<CompletedRequest, 'path' | 'body' | 'headers'>,
    statusCode: number = 204,
  ) => {
    const srpIdentifier = getSrpIdentifierFromHeaders(request.headers);
    const isFeatureEntry = determineIfFeatureEntryFromURL(request.path);

    const data = (await request.body.getJson()) as {
      data?: string | Record<string, string>;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      batch_delete?: string[];
    };

    // We're handling batch delete inside the PUT method due to API limitations
    if (data?.batch_delete) {
      const keysToDelete = data.batch_delete;

      const internalPathData = this.paths.get(path);

      if (!internalPathData) {
        this.eventEmitter.emit(
          UserStorageMockttpControllerEvents.DELETE_BATCH_NOT_FOUND,
          {
            path,
            statusCode,
          },
        );

        return {
          statusCode,
        };
      }

      this.paths.set(path, {
        ...internalPathData,
        response: internalPathData.response.filter(
          (entry) => !keysToDelete.includes(entry.HashedKey),
        ),
      });

      this.eventEmitter.emit(UserStorageMockttpControllerEvents.DELETE_BATCH, {
        path,
        statusCode,
      });
    }

    if (data?.data) {
      const newOrUpdatedSingleOrBatchEntries =
        isFeatureEntry && typeof data?.data === 'string'
          ? [
              {
                HashedKey: request.path.split('/').pop() as string,
                Data: data?.data,
                SrpIdentifier: srpIdentifier,
              },
            ]
          : Object.entries(data?.data).map(([key, value]) => ({
              HashedKey: key,
              Data: value,
              SrpIdentifier: srpIdentifier,
            }));

      newOrUpdatedSingleOrBatchEntries.forEach((entry) => {
        const internalPathData = this.paths.get(path);

        if (!internalPathData) {
          return;
        }

        const doesThisEntryExist = internalPathData.response?.find(
          (existingEntry) => existingEntry.HashedKey === entry.HashedKey,
        );

        if (doesThisEntryExist) {
          this.paths.set(path, {
            ...internalPathData,
            response: internalPathData.response.map((existingEntry) =>
              existingEntry.HashedKey === entry.HashedKey
                ? entry
                : existingEntry,
            ),
          });
        } else {
          this.paths.set(path, {
            ...internalPathData,
            response: [
              ...(internalPathData?.response || []),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              entry as { HashedKey: string; Data: string },
            ],
          });
        }

        if (newOrUpdatedSingleOrBatchEntries.length === 1) {
          this.eventEmitter.emit(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
            {
              path,
              statusCode,
            },
          );
        } else {
          this.eventEmitter.emit(UserStorageMockttpControllerEvents.PUT_BATCH, {
            path,
            statusCode,
          });
        }
      });
    }

    return {
      statusCode,
    };
  };

  readonly onDelete = async (
    path: keyof typeof pathRegexps,
    request: Pick<CompletedRequest, 'path'>,
    statusCode: number = 204,
  ) => {
    const internalPathData = this.paths.get(path);

    if (!internalPathData) {
      this.eventEmitter.emit(
        UserStorageMockttpControllerEvents.DELETE_NOT_FOUND,
        {
          path,
          statusCode,
        },
      );

      return {
        statusCode,
      };
    }

    const isFeatureEntry = determineIfFeatureEntryFromURL(request.path);

    if (isFeatureEntry) {
      this.paths.set(path, {
        ...internalPathData,
        response: internalPathData?.response.filter(
          (entry) => entry.HashedKey !== request.path.split('/').pop(),
        ),
      });

      this.eventEmitter.emit(UserStorageMockttpControllerEvents.DELETE_SINGLE, {
        path,
        statusCode,
      });
    } else {
      this.paths.set(path, {
        ...internalPathData,
        response: [],
      });

      this.eventEmitter.emit(UserStorageMockttpControllerEvents.DELETE_ALL, {
        path,
        statusCode,
      });
    }

    return {
      statusCode,
    };
  };

  setupPath = (
    path: keyof typeof pathRegexps,
    server: Mockttp,
    overrides?: {
      getResponse?: UserStorageResponseData[];
      getStatusCode?: number;
      putStatusCode?: number;
      deleteStatusCode?: number;
    },
  ) => {
    const previouslySetupPath = this.paths.get(path);

    this.paths.set(path, {
      response: overrides?.getResponse || previouslySetupPath?.response || [],
      server,
    });

    this.paths
      .get(path)
      ?.server.forGet(pathRegexps[path])
      .always()
      .thenCallback((request) =>
        this.onGet(path, request, overrides?.getStatusCode),
      );
    this.paths
      .get(path)
      ?.server.forPut(pathRegexps[path])
      .always()
      .thenCallback((request) =>
        this.onPut(path, request, overrides?.putStatusCode),
      );
    this.paths
      .get(path)
      ?.server.forDelete(pathRegexps[path])
      .always()
      .thenCallback((request) =>
        this.onDelete(path, request, overrides?.deleteStatusCode),
      );
  };
}
