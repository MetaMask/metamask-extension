import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { useComplianceGate } from './useComplianceGate';

export function useSelectedAccountComplianceGate() {
  const selectedAccount = useSelector(getSelectedInternalAccount);

  return useComplianceGate(selectedAccount?.address ?? '');
}
