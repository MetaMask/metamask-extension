import { CompletedRequest, Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';

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
};

type UserStorageResponseData = { HashedKey: string; Data: string };

const determineIfFeatureEntryFromURL = (url: string) =>
  url.substring(url.lastIndexOf('userstorage') + 12).split('/').length === 2;

export class UserStorageMockttpController {
  paths: Map<
    keyof typeof pathRegexps,
    {
      response: UserStorageResponseData[];
      server: Mockttp;
    }
  > = new Map();

  readonly onGet = async (
    path: keyof typeof pathRegexps,
    request: Pick<CompletedRequest, 'path'>,
    statusCode: number = 200,
  ) => {
    const internalPathData = this.paths.get(path);

    if (!internalPathData) {
      return {
        statusCode,
        json: null,
      };
    }

    const isFeatureEntry = determineIfFeatureEntryFromURL(request.path);

    if (isFeatureEntry) {
      const json =
        internalPathData.response?.find(
          (entry) => entry.HashedKey === request.path.split('/').pop(),
        ) || null;

      return {
        statusCode,
        json,
      };
    }

    const json = internalPathData?.response.length
      ? internalPathData.response
      : null;

    return {
      statusCode,
      json,
    };
  };

  readonly onPut = async (
    path: keyof typeof pathRegexps,
    request: Pick<CompletedRequest, 'path' | 'body'>,
    statusCode: number = 204,
  ) => {
    const isFeatureEntry = determineIfFeatureEntryFromURL(request.path);

    const data = (await request.body.getJson()) as {
      data?: string | Record<string, string>;
      batch_delete?: string[];
    };

    // We're handling batch delete inside the PUT method due to API limitations
    if (data?.batch_delete) {
      const keysToDelete = data.batch_delete;

      const internalPathData = this.paths.get(path);

      if (!internalPathData) {
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
    }

    if (data?.data) {
      const newOrUpdatedSingleOrBatchEntries =
        isFeatureEntry && typeof data?.data === 'string'
          ? [
              {
                HashedKey: request.path.split('/').pop() as string,
                Data: data?.data,
              },
            ]
          : Object.entries(data?.data).map(([key, value]) => ({
              HashedKey: key,
              Data: value,
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
              entry as { HashedKey: string; Data: string },
            ],
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
    } else {
      this.paths.set(path, {
        ...internalPathData,
        response: [],
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
