import { connect } from 'react-redux';
import {
  getNfts,
  getNativeCurrency,
} from '../../../../ducks/metamask/metamask';
import {
  getMetaMaskAccounts,
  getNativeCurrencyImage,
} from '../../../../selectors';
import { updateSendAsset, getSendAsset } from '../../../../ducks/send';
import SendAssetRow from './send-asset-row.component';

function mapStateToProps(state) {
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    nfts: getNfts(state),
    sendAsset: getSendAsset(state),
    accounts: getMetaMaskAccounts(state),
    nativeCurrency: getNativeCurrency(state),
    nativeCurrencyImage: getNativeCurrencyImage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: ({ type, details }) =>
      dispatch(updateSendAsset({ type, details })),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);
