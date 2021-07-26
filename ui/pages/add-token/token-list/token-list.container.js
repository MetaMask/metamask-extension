import { connect } from 'react-redux';
import TokenList from './token-list.component';

const mapStateToProps = ({ metamask }) => {
  const { tokens, useStaticTokenList } = metamask;
  return {
    tokens,
    useStaticTokenList,
  };
};

export default connect(mapStateToProps)(TokenList);
