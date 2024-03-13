import { connect } from 'react-redux';
import {
  getSendAsset,
  getAssetError,
  getRecipient,
  acknowledgeRecipientWarning,
  getRecipientWarningAcknowledgement,
} from '../../../../ducks/send';
import SendContent from './send-content.component';

function mapStateToProps(state) {
  const recipient = getRecipient(state);
  const recipientWarningAcknowledged =
    getRecipientWarningAcknowledgement(state);

  return {
    asset: getSendAsset(state),
    assetError: getAssetError(state),
    recipient,
    recipientWarningAcknowledged,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    acknowledgeRecipientWarning: () => dispatch(acknowledgeRecipientWarning()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendContent);
