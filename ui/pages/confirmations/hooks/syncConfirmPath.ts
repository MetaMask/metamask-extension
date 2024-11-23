import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Confirmation } from '../types/confirm';
import { useConfirmationNavigation } from './useConfirmationNavigation';

const syncConfirmPath = (currentConfirmation?: Confirmation) => {
  const { navigateToId } = useConfirmationNavigation();
  const { id: paramId } = useParams<{ id: string }>();

  useEffect(() => {
    if (!currentConfirmation) {
      return;
    }

    if (!paramId) {
      navigateToId(currentConfirmation.id);
    }
  }, [currentConfirmation, paramId, navigateToId]);
};

export default syncConfirmPath;
