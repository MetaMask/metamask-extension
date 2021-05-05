import { connect } from 'react-redux';
import TokenList from './token-list.component';

const mapStateToProps = ({ metamask }) => {
  const { tokens } = metamask;
  return {
    tokens,
  };
};

export default connect(mapStateToProps)(TokenList);
