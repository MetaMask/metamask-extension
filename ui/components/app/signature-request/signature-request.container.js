import { connect } from 'react-redux';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { accountsWithSendEtherInfoSelector } from '../../../selectors';
import { getAccountByAddress } from '../../../helpers/utils/util';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import SignatureRequest from './signature-request.component';

function mapStateToProps(state) {
  return {
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
  const { allAccounts } = stateProps;
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
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SignatureRequest);
