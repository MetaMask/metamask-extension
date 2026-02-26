import { connect } from 'react-redux';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  const { allTokens, accountsAssets } = state.metamask;
  return {
    allTokens,
    accountsAssets,
  };
};

export default connect(mapStateToProps)(TokenList);
