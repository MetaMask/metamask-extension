import { connect } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  doesAddressRequireLedgerHidConnection,
} from '../../../selectors';
import { isAddressLedger } from '../../../ducks/metamask/metamask';
import { getAccountByAddress } from '../../../helpers/utils/util';
import SignatureRequest from './signature-request-siwe.component';

function mapStateToProps(state, ownProps) {
  const {
    metamask: { subjectMetadata = {} },
  } = state;

  const { txData } = ownProps;
  const {
    msgParams: { from },
  } = txData;
  const hardwareWalletRequiresConnection = doesAddressRequireLedgerHidConnection(
    state,
    from,
  );
  const isLedgerWallet = isAddressLedger(state, from);

  return {
    subjectMetadata,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    // not forwarded to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const {
    subjectMetadata,
    allAccounts,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
  } = stateProps;
  const { signPersonalMessage, cancelPersonalMessage, txData } = ownProps;

  const {
    msgParams: { origin, from },
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);
  const cancel = cancelPersonalMessage;
  const sign = signPersonalMessage;
  const targetSubjectMetadata = subjectMetadata[origin];

  return {
    ...ownProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancel,
    sign,
    subjectMetadata: targetSubjectMetadata,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
  };
}

export default connect(mapStateToProps, null, mergeProps)(SignatureRequest);
