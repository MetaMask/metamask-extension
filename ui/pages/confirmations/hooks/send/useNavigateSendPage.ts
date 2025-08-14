import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { useSendContext } from '../../context/send';
import { SendPages } from '../../constants/send';

export const useNavigateSendPage = () => {
  const history = useHistory();
  const { currentPage, updateCurrentPage } = useSendContext();

  const goToAmountPage = useCallback(() => {
    updateCurrentPage(SendPages.AMOUNT);
  }, [updateCurrentPage]);

  const goToSendToPage = useCallback(() => {
    updateCurrentPage(SendPages.RECIPIENT);
  }, [updateCurrentPage]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage === SendPages.RECIPIENT) {
      updateCurrentPage(SendPages.AMOUNT);
    } else if (currentPage === SendPages.AMOUNT) {
      updateCurrentPage(SendPages.ASSET);
    } else {
      history.goBack();
    }
  }, [currentPage, history, updateCurrentPage]);

  return { goToAmountPage, goToPreviousPage, goToSendToPage };
};
