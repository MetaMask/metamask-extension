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
} from '../../selectors/selectors';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
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

  const isTokenDetectionInactiveOnMainnet = getIsTokenDetectionInactiveOnMainnet(
    state,
  );
  const showSearchTab =
    getIsTokenDetectionSupported(state) ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);
  const caseInSensitiveTokenList = isTokenDetectionInactiveOnMainnet
    ? STATIC_MAINNET_TOKEN_LIST
    : tokenList;

  return {
    identities,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    tokens,
    pendingTokens,
    showSearchTab,
    chainId,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    caseInSensitiveTokenList,
    useTokenDetection,
    selectedAddress,
    isDynamicTokenListAvailable: getIsDynamicTokenListAvailable(state),
    networkName: getTokenDetectionSupportNetworkByChainId(state),
    isTokenDetectionInactiveOnMainnet,
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
