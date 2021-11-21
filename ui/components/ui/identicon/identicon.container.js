import { connect } from 'react-redux';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, useTokenDetection, tokenList },
  } = state;

  return {
    useBlockie,
    useTokenDetection,
    tokenList,
  };
};

export default connect(mapStateToProps)(Identicon);
