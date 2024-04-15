import { connect } from 'react-redux';
import { cancelTx } from '../../../../store/actions';
import {
  resetSendState,
  getSendStage,
  getSendTo,
  getSendErrors,
  isSendFormInvalid,
  signTransaction,
  getDraftTransactionID,
} from '../../../../ducks/send';
import { getMostRecentOverviewPage } from '../../../../ducks/history/history';
import { getSendToAccounts } from '../../../../ducks/metamask/metamask';
import SendFooter from './send-footer.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter);

function mapStateToProps(state) {
  return {
    disabled: isSendFormInvalid(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    sendStage: getSendStage(state),
    sendErrors: getSendErrors(state),
    draftTransactionID: getDraftTransactionID(state),
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    resetSendState: () => dispatch(resetSendState()),
    cancelTx: (t) => dispatch(cancelTx(t)),
    sign: () => dispatch(signTransaction()),
  };
}
