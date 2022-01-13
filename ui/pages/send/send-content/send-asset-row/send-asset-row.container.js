import { connect } from 'react-redux';
import {
  getCollectibles,
  getNativeCurrency,
} from '../../../../ducks/metamask/metamask';
import {
  getMetaMaskAccounts,
  getNativeCurrencyImage,
  getPreferences
} from '../../../../selectors';
import { updateSendAsset, getSendAsset } from '../../../../ducks/send';
import SendAssetRow from './send-asset-row.component';

function mapStateToProps(state) {
  const {hideZeroBalanceTokens} = getPreferences(state);
  
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    collectibles: getCollectibles(state),
    sendAsset: getSendAsset(state),
    accounts: getMetaMaskAccounts(state),
    nativeCurrency: getNativeCurrency(state),
    nativeCurrencyImage: getNativeCurrencyImage(state),
    hideZeroBalanceTokens
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: ({ type, details }) =>
      dispatch(updateSendAsset({ type, details })),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);
