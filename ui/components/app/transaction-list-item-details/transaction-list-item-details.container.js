import { connect } from 'react-redux';
import { compose } from 'redux';
import { TransactionStatus } from '@metamask/transaction-controller';
import withRouterHooks from '../../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import {
  getAccountName,
  getAddressBook,
  getBlockExplorerLinkText,
  getInternalAccounts,
  getIsCustomNetwork,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors';
import { isHardwareWallet } from '../../../../shared/lib/selectors/keyring';
import { tryReverseResolveAddress } from '../../../store/actions';
import TransactionListItemDetails from './transaction-list-item-details.component';

// DelegationFramework caveat enforcers revert with `Error(string)` messages of
// the form `<EnforcerName>:<reason>` (Solidity convention). Detect any such
// message generically rather than hard-coding the list of enforcer names.
const CAVEAT_ENFORCER_REVERT_PATTERN = /^[A-Z][A-Za-z0-9]*Enforcer:/u;

const mapStateToProps = (state, ownProps) => {
  const { senderAddress, transactionGroup } = ownProps;
  const addressBook = getAddressBook(state);
  const accounts = getInternalAccounts(state);
  const senderAccountName = getAccountName(accounts, senderAddress);

  const getNickName = (address) => {
    const entry = addressBook.find((contact) => {
      return address.toLowerCase() === contact.address.toLowerCase();
    });
    return (entry && entry.name) || '';
  };
  const rpcPrefs = getRpcPrefsForCurrentProvider(state);

  const networkConfiguration = getNetworkConfigurationsByChainId(state);
  const isCustomNetwork = getIsCustomNetwork(state);

  const primaryTransaction = transactionGroup?.primaryTransaction;
  const receiptRevertMessage = primaryTransaction?.revert?.receipt?.message;
  const isProtectedByEnforcedSimulations =
    primaryTransaction?.status === TransactionStatus.failed &&
    typeof receiptRevertMessage === 'string' &&
    CAVEAT_ENFORCER_REVERT_PATTERN.test(receiptRevertMessage);

  return {
    rpcPrefs,
    networkConfiguration,
    senderNickname: senderAccountName || getNickName(senderAddress),
    isCustomNetwork,
    blockExplorerLinkText: getBlockExplorerLinkText(state),
    isHardwareWalletAccount: isHardwareWallet(state),
    isProtectedByEnforcedSimulations,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(TransactionListItemDetails);
