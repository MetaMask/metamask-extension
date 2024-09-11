import { infuraProjectId } from '../../../../shared/constants/network';

export const stripKeyFromInfuraUrl = (endpoint: string) => {
  let modifiedEndpoint = endpoint;

  if (modifiedEndpoint.endsWith('/v3/{infuraProjectId}')) {
    modifiedEndpoint = modifiedEndpoint.replace('/v3/{infuraProjectId}', '');
  } else if (modifiedEndpoint.endsWith(`/v3/${infuraProjectId}`)) {
    modifiedEndpoint = modifiedEndpoint.replace(`/v3/${infuraProjectId}`, '');
  }

  return modifiedEndpoint;
};
