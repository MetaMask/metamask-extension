import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Confirmation } from '../types/confirm';
import { useConfirmationNavigation } from './useConfirmationNavigation';

const syncConfirmPath = (currentConfirmation?: Confirmation) => {
  const { navigateToId } = useConfirmationNavigation();
  const { id: paramId } = useParams<{ id: string }>();
  const confirmationId = currentConfirmation?.id;

  useEffect(() => {
    if (!confirmationId) {
      return;
    }

    if (!paramId) {
      navigateToId(confirmationId);
    }
  }, [confirmationId, paramId, navigateToId]);
};

export default syncConfirmPath;
