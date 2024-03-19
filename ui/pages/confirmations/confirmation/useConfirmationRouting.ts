import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getUnapprovedTemplatedConfirmations } from '../../../selectors';
import { isEqual } from 'lodash';

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
