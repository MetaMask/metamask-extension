import { connect } from 'react-redux';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, useTokenDetection, tokenList, ipfsGateway },
  } = state;

  return {
    useBlockie,
    useTokenDetection,
    tokenList,
    ipfsGateway,
  };
};

export default connect(mapStateToProps)(Identicon);
