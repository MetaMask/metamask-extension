import { connect } from 'react-redux';
import TokenList from './token-list.component';

const mapStateToProps = (state) => {
  const { tokens } = state.metamask;
  return {
    tokens,
  };
};

export default connect(mapStateToProps)(TokenList);
