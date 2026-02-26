import { connect } from 'react-redux';
import { getTokensControllerAllTokens } from '../../../../../shared/modules/selectors/assets-migration';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  const allTokens = getTokensControllerAllTokens(state);
  const { accountsAssets } = state.metamask;
  return {
    allTokens,
    accountsAssets,
  };
};

export default connect(mapStateToProps)(TokenList);
