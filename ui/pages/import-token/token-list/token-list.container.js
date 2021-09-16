import { connect } from 'react-redux';
import TokenList from './token-list.component';

const mapStateToProps = ({ metamask }) => {
  const { tokens, useTokenDetection } = metamask;
  return {
    tokens,
    useTokenDetection,
  };
};

export default connect(mapStateToProps)(TokenList);
