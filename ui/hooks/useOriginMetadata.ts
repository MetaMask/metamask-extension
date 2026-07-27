import { SubjectType } from '@metamask/permission-controller';
import { useSelector } from 'react-redux';
import { getTargetSubjectMetadata } from '../selectors';

export type OriginMetadata = {
  hostname: string;
  origin: string;
  iconUrl?: string | null;
  name?: string;
  host?: string;
  subjectType?: SubjectType;
  [key: string]: unknown;
};

/**
 * Gets origin metadata from redux and formats it appropriately.
 *
 * @param origin - The fully formed url of the site interacting with
 * MetaMask
 * @returns The origin metadata available for the current origin
 */
export function useOriginMetadata(origin?: string): OriginMetadata | null {
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, origin),
  );

  if (!origin) {
    return null;
  }

  let minimumOriginMetadata: OriginMetadata | null = null;
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
    return targetSubjectMetadata as OriginMetadata;
  }

  return minimumOriginMetadata;
}
