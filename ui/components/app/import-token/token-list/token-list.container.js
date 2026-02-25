import { connect } from 'react-redux';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  // TODO: Refactor this to use the new state structure based on the feature flag.
  const { allTokens, accountsAssets } = state.metamask;
  return {
    allTokens,
    accountsAssets,
  };
};

export default connect(mapStateToProps)(TokenList);
