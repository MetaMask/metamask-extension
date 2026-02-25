import { StaticAssetsService } from '../controllers/static-assets-service';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { ControllerInitFunction } from './types';
import { StaticAssetsServiceMessenger } from './messengers';

export const StaticAssetsServiceInit: ControllerInitFunction<
  StaticAssetsService,
  StaticAssetsServiceMessenger
> = ({ controllerMessenger }) => {
  const service = new StaticAssetsService({
    messenger: controllerMessenger,
    fetchFn: async (url, requestOptions, cacheOptions) => {
      const urlString = url.toString();
      return await fetchWithCache({
        url: urlString,
        fetchOptions: { method: 'GET', ...requestOptions },
        cacheOptions: { ...cacheOptions },
        functionName: 'fetchTopAssets',
      });
    },
  });
  return {
    controller: service,
    memStateKey: null,
    persistedStateKey: null,
  };
};
