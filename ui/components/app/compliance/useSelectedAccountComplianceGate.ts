import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import { useComplianceGate } from './useComplianceGate';

export function useSelectedAccountComplianceGate() {
  const selectedAccount = useSelector(getSelectedInternalAccount);

  return useComplianceGate(selectedAccount?.address ?? '');
}
