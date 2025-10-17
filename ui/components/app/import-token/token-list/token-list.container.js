import { connect } from 'react-redux';
import { getSelectedInternalAccount } from '../../../../selectors';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  const { allTokens } = state.metamask;
  const { address } = getSelectedInternalAccount(state);
  return {
    allTokens,
    accountAddress: address,
  };
};

export default connect(mapStateToProps)(TokenList);
