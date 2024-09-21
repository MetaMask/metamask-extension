import { SubjectType } from '@metamask/permission-controller';
import { useSelector } from 'react-redux';
import { getTargetSubjectMetadata } from '../selectors';

/**
 * @typedef {object} OriginMetadata
 * @property {string} hostname - The hostname of the origin (host + port)
 * @property {string} origin - The original origin string itself
 * @property {string} [iconUrl] - The origin's site icon URL, if available
 * @property {string} [name] - The registered name of the origin if available
 */

/**
 * Gets origin metadata from redux and formats it appropriately.
 *
 * @param {string} origin - The fully formed url of the site interacting with
 * MetaMask
 * @returns {OriginMetadata | null} The origin metadata available for the
 * current origin
 */
export function useOriginMetadata(origin) {
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, origin),
  );

  if (!origin) {
    return null;
  }

  let minimumOriginMetadata = null;
  try {
    const url = new URL(origin);
    minimumOriginMetadata = {
      host: url.host,
      hostname: url.hostname,
      origin,
      subjectType: SubjectType.Unknown,
    };
  } catch (_) {
    // do nothing
  }

  if (targetSubjectMetadata && minimumOriginMetadata) {
    return {
      ...minimumOriginMetadata,
      ...targetSubjectMetadata,
    };
  } else if (targetSubjectMetadata) {
    return targetSubjectMetadata;
  }

  return minimumOriginMetadata;
}
