import { connect } from 'react-redux';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  accountsWithSendEtherInfoSelector,
  getHardwareWalletType,
} from '../../../selectors';
import { getAccountByAddress } from '../../../helpers/utils/util';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { KEYRING_TYPES } from '../../../../shared/constants/hardware-wallets';
import SignatureRequest from './signature-request.component';

function mapStateToProps(state) {
  const hardwareWalletType = getHardwareWalletType(state);

  const isLedgerWallet = hardwareWalletType === KEYRING_TYPES.LEDGER;

  return {
    isLedgerWallet,
    // not forwarded to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { allAccounts, isLedgerWallet } = stateProps;
  const {
    signPersonalMessage,
    signTypedMessage,
    cancelPersonalMessage,
    cancelTypedMessage,
    signMessage,
    cancelMessage,
    txData,
  } = ownProps;

  const {
    type,
    msgParams: { from },
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);

  let cancel;
  let sign;

  if (type === MESSAGE_TYPE.PERSONAL_SIGN) {
    cancel = cancelPersonalMessage;
    sign = signPersonalMessage;
  } else if (type === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
    cancel = cancelTypedMessage;
    sign = signTypedMessage;
  } else if (type === MESSAGE_TYPE.ETH_SIGN) {
    cancel = cancelMessage;
    sign = signMessage;
  }

  return {
    ...ownProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancel,
    sign,
    isLedgerWallet,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SignatureRequest);
