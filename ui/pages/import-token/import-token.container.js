import { connect } from 'react-redux';

import {
  setPendingTokens,
  clearPendingTokens,
  getTokenStandardAndDetails,
  setTokenDetectionNoticeDismissed,
  setTokenDetectionWarningDismissed,
} from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import {
  getRpcPrefsForCurrentProvider,
  getIsTokenDetectionSupported,
  getTokenDetectionSupportNetworkByChainId,
  getTokenDetectionNoticeDismissed,
  getTokenDetectionWarningDismissed,
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
      tokenList,
      selectedAddress,
    },
  } = state;
  const showSearchTabCustomNetwork =
    useTokenDetection && Boolean(Object.keys(tokenList).length);
  const showSearchTab =
    getIsTokenDetectionSupported(state) ||
    showSearchTabCustomNetwork ||
    process.env.IN_TEST;
  return {
    identities,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    tokens,
    pendingTokens,
    showSearchTab,
    chainId,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    tokenList,
    useTokenDetection,
    selectedAddress,
    isTokenDetectionSupported: getIsTokenDetectionSupported(state),
    networkName: getTokenDetectionSupportNetworkByChainId(state),
    tokenDetectionNoticeDismissed: getTokenDetectionNoticeDismissed(state),
    tokenDetectionWarningDismissed: getTokenDetectionWarningDismissed(state),
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    setPendingTokens: (tokens) => dispatch(setPendingTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
    getTokenStandardAndDetails: (address, selectedAddress) =>
      getTokenStandardAndDetails(address, selectedAddress, null),
    setTokenDetectionNoticeDismissed: () =>
      dispatch(setTokenDetectionNoticeDismissed()),
    setTokenDetectionWarningDismissed: () =>
      dispatch(setTokenDetectionWarningDismissed()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ImportToken);
