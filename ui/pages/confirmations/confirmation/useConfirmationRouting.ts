import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { isEqual } from 'lodash';
import { getUnapprovedTemplatedConfirmations } from '../../../selectors';

/**
 * A utility hook that parses an optional ID from the URL and
 * returns the confirmation with that ID for routing purposes.
 *
 * @returns A pending confirmation if applicable.
 */
export function useConfirmationRouting() {
  const pendingConfirmations = useSelector(
    getUnapprovedTemplatedConfirmations,
    isEqual,
  );

  const { id } = useParams();

  if (!id) {
    return null;
  }

  return pendingConfirmations.find((confirmation) => confirmation.id === id);
}
