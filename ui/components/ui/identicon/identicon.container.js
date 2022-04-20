import { connect } from 'react-redux';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, tokenList, ipfsGateway },
  } = state;

  return {
    useBlockie,
    tokenList,
    ipfsGateway,
  };
};

export default connect(mapStateToProps)(Identicon);
