import { connect } from 'react-redux';
import {
  getIsEthGasPriceFetched,
  getNoGasPriceFetched,
  checkNetworkOrAccountNotSupports1559,
} from '../../../../selectors';
import {
  getIsBalanceInsufficient,
  getSendAsset,
  getAssetError,
  getRecipient,
  acknowledgeRecipientWarning,
  getRecipientWarningAcknowledgement,
  hasSendLayer1GasFee,
} from '../../../../ducks/send';
import SendContent from './send-content.component';

function mapStateToProps(state) {
  const recipient = getRecipient(state);
  const recipientWarningAcknowledged =
    getRecipientWarningAcknowledgement(state);

  return {
    isEthGasPrice: getIsEthGasPriceFetched(state),
    noGasPrice: getNoGasPriceFetched(state),
    networkOrAccountNotSupports1559:
      checkNetworkOrAccountNotSupports1559(state),
    getIsBalanceInsufficient: getIsBalanceInsufficient(state),
    asset: getSendAsset(state),
    assetError: getAssetError(state),
    recipient,
    recipientWarningAcknowledged,
    hasLayer1GasFee: hasSendLayer1GasFee(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    acknowledgeRecipientWarning: () => dispatch(acknowledgeRecipientWarning()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendContent);
