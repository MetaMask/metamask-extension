import { connect } from 'react-redux';
import { compose } from 'redux';
import withRouterHooks from '../../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { isProtectedByEnforcedSimulations } from '../../../pages/confirmations/utils/confirm';
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

  const isProtected = isProtectedByEnforcedSimulations(
    transactionGroup?.primaryTransaction,
  );

  return {
    rpcPrefs,
    networkConfiguration,
    senderNickname: senderAccountName || getNickName(senderAddress),
    isCustomNetwork,
    blockExplorerLinkText: getBlockExplorerLinkText(state),
    isHardwareWalletAccount: isHardwareWallet(state),
    isProtectedByEnforcedSimulations: isProtected,
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
