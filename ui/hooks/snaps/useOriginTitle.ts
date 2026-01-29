import { isSnapId } from '@metamask/snaps-utils';
import { getSnapMetadata } from '../../selectors';
import { useSelector } from 'react-redux';
import { transformOriginToTitle } from '../../helpers/utils/util';

/**
 * A hook to get the title of a Snap or website origin.
 *
 * @param origin - The origin of the Snap or website.
 * @returns The title of the Snap or website.
 * @example
 * const title = useOriginTitle('npm:example-snap');
 * // "Example Snap"
 * @example
 * const title = useOriginTitle('https://example.com');
 * // "example.com"
 */
export function useOriginTitle(origin?: string) {
  const { name } = useSelector((state) =>
    // Hack around the selector throwing.
    getSnapMetadata(state, isSnapId(origin) ? origin : `npm:${origin}`),
  );

  if (!origin) {
    return 'Unknown Origin';
  }

  if (isSnapId(origin)) {
    return name;
  }

  return transformOriginToTitle(origin);
}
