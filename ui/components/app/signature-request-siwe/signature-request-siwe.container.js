import { connect } from 'react-redux';
import { accountsWithSendEtherInfoSelector } from '../../../selectors';
import { getAccountByAddress } from '../../../helpers/utils/util';
import SignatureRequest from './signature-request-siwe.component';

function mapStateToProps(state) {
  const {
    metamask: { subjectMetadata = {} },
  } = state;

  return {
    subjectMetadata,
    allAccounts: accountsWithSendEtherInfoSelector(state),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { subjectMetadata, allAccounts } = stateProps;
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
  };
}

export default connect(mapStateToProps, null, mergeProps)(SignatureRequest);
