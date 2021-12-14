import { useSelector } from 'react-redux';
import { getSubjectMetadata } from '../selectors';
import { SUBJECT_TYPES } from '../../shared/constants/app';

/**
 * @typedef {Object} OriginMetadata
 * @property {string} hostname - The hostname of the origin (host + port)
 * @property {string} origin - The original origin string itself
 * @property {string} [iconUrl] - The origin's site icon URL, if available
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
  const subjectMetadata = useSelector(getSubjectMetadata);
  if (!origin) {
    return null;
  }

  const url = new URL(origin);
  const minimumOriginMetadata = {
    host: url.host,
    hostname: url.hostname,
    origin,
    subjectType: SUBJECT_TYPES.UNKNOWN,
  };

  if (subjectMetadata?.[origin]) {
    return {
      ...minimumOriginMetadata,
      ...subjectMetadata[origin],
    };
  }
  return minimumOriginMetadata;
}
