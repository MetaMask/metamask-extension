import { connect } from 'react-redux';
import { getIsTokenDetectionInactiveOnMainnet } from '../../../selectors';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  const { tokens } = state.metamask;
  return {
    tokens,
    isTokenDetectionInactiveOnMainnet: getIsTokenDetectionInactiveOnMainnet(
      state,
    ),
  };
};

export default connect(mapStateToProps)(TokenList);
