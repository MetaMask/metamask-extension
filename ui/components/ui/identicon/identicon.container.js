import { connect } from 'react-redux';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, useStaticTokenList, tokenList },
  } = state;

  return {
    useBlockie,
    useStaticTokenList,
    tokenList,
  };
};

export default connect(mapStateToProps)(Identicon);
