import { connect } from 'react-redux';

import {
  setPendingTokens,
  clearPendingTokens,
  getTokenStandardAndDetails,
} from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import {
  getRpcPrefsForCurrentProvider,
  getIsTokenDetectionSupported,
  getTokenDetectionSupportNetworkByChainId,
  getIsTokenDetectionInactiveOnMainnet,
  getIsDynamicTokenListAvailable,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getTokenList,
} from '../../selectors/selectors';
import ImportToken from './import-token.component';

const mapStateToProps = (state) => {
  const {
    metamask: {
      identities,
      tokens,
      pendingTokens,
      provider: { chainId },
      useTokenDetection,
      selectedAddress,
    },
  } = state;

  const isTokenDetectionInactiveOnMainnet =
    getIsTokenDetectionInactiveOnMainnet(state);
  const showSearchTab =
    getIsTokenDetectionSupported(state) ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);

  return {
    identities,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    tokens,
    pendingTokens,
    showSearchTab,
    chainId,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    tokenList: getTokenList(state),
    useTokenDetection,
    selectedAddress,
    isDynamicTokenListAvailable: getIsDynamicTokenListAvailable(state),
    networkName: getTokenDetectionSupportNetworkByChainId(state),
    tokenDetectionInactiveOnNonMainnetSupportedNetwork:
      getIstokenDetectionInactiveOnNonMainnetSupportedNetwork(state),
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    setPendingTokens: (tokens) => dispatch(setPendingTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
    getTokenStandardAndDetails: (address, selectedAddress) =>
      getTokenStandardAndDetails(address, selectedAddress, null),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ImportToken);
