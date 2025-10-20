import { useSelector } from 'react-redux';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors';

export const useIsBIP44 = () => {
  return useSelector(getIsMultichainAccountsState2Enabled);
};
