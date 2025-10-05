import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useConfirmationNavigation } from './useConfirmationNavigation';

const syncConfirmPath = (confirmationId?: string) => {
  const { navigateToId } = useConfirmationNavigation();
  const { id: paramId } = useParams<{ id: string }>();

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
