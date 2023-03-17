import Resolution, {
  ResolutionError,
  ResolutionErrorCode,
} from '@unstoppabledomains/resolution';
import { infuraProjectId } from '../../../../shared/constants/network';

// Sets the Provider URLS to the MetaMask defaults
const ethereumProviderUrl = `https://mainnet.infura.io/v3/${infuraProjectId}`;
const polygonProviderUrl = `https://polygon-mainnet.infura.io/v3/${infuraProjectId}`;
/**
 * Resolves an Unstoppable Domain into an IPFS Website Hash
 *
 * @param {string} domainName - a Valid Unstoppable Domain Name
 */
export default async function resolveUnsToIpfsContentId(domainName) {
  try {
    const resolution = new Resolution({
      sourceConfig: {
        uns: {
          locations: {
            Layer1: {
              url: ethereumProviderUrl,
              network: 'mainnet',
            },
            Layer2: {
              url: polygonProviderUrl,
              network: 'polygon-mainnet',
            },
          },
        },
      },
    });
    const result = await resolution.ipfsHash(domainName);
    return result;
  } catch (err) {
    if (err instanceof ResolutionError) {
      if (err.code === ResolutionErrorCode.RecordNotFound) {
        throw new Error(
          `UnsIpfsResolver - no content ID found for name "${domainName}"`,
        );
      }
      if (err.code === ResolutionErrorCode.UnregisteredDomain) {
        throw new Error(
          `UnsIpfsResolver - name "${domainName}" is not registered`,
        );
      }
    } else {
      throw new Error(
        `UnsIpfsResolver - no resolver found for name "${domainName}"`,
      );
    }
  }
  return null;
}
