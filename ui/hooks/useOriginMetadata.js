import { useSelector } from 'react-redux';
import { getDomainMetadata } from '../selectors';

/**
 * @typedef {Object} OriginMetadata
 * @property {string} host - The host of the origin
 * @property {string} hostname - The hostname of the origin (host + port)
 * @property {string} origin - The original origin string itself
 * @property {string} [icon] - The origin's site icon if available
 * @property {number} [lastUpdated] - Timestamp of the last update to the
 *  origin's metadata
 * @property {string} [name] - The registered name of the origin if available
 */

/**
 * Gets origin metadata from redux and formats it appropriately.
 * @param {string} origin - The fully formed url of the site interacting with
 *  MetaMask
 * @returns {OriginMetadata | null} - The origin metadata available for the
 *  current origin
 */
export function useOriginMetadata(origin) {
  const domainMetaData = useSelector(getDomainMetadata);
  if (!origin) {
    return null;
  }
  const url = new URL(origin);

  const minimumOriginMetadata = {
    host: url.host,
    hostname: url.hostname,
    origin,
  };

  if (domainMetaData?.[origin]) {
    return {
      ...minimumOriginMetadata,
      ...domainMetaData[origin],
    };
  }
  return minimumOriginMetadata;
}
