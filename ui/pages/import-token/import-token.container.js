import { connect } from 'react-redux';

import { setPendingTokens, clearPendingTokens } from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getRpcPrefsForCurrentProvider } from '../../selectors/selectors';
import ImportToken from './import-token.component';

const mapStateToProps = (state) => {
  const {
    metamask: {
      identities,
      tokens,
      pendingTokens,
      provider: { chainId },
      tokenList,
    },
  } = state;
  const showSearchTab = Boolean(Object.keys(tokenList).length);
  return {
    identities,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    tokens,
    pendingTokens,
    showSearchTab: showSearchTab || process.env.IN_TEST === 'true',
    chainId,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    tokenList,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setPendingTokens: (tokens) => dispatch(setPendingTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ImportToken);
