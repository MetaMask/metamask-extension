import { connect } from 'react-redux';
import {
  getTokensControllerAllTokens,
  getMultiChainAssetsControllerAccountsAssets,
} from '../../../../../shared/modules/selectors/assets-migration';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  const allTokens = getTokensControllerAllTokens(state);
  const accountsAssets = getMultiChainAssetsControllerAccountsAssets(state);
  return {
    allTokens,
    accountsAssets,
  };
};

export default connect(mapStateToProps)(TokenList);
