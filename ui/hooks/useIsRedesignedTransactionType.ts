import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsRedesignedConfirmationType } from '../selectors';

export const useIsRedesignedConfirmationType = () => {
  const location = useLocation();
  const confirmationId = location.pathname.split('/confirm-transaction/')[1];

  return useSelector((state) =>
    selectIsRedesignedConfirmationType(state, confirmationId),
  );
};
