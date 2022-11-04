import { connect } from 'react-redux';
import { getTokenList } from '../../../selectors';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, ipfsGateway },
  } = state;

  return {
    useBlockie,
    tokenList: getTokenList(state),
    ipfsGateway,
  };
};

export default connect(mapStateToProps)(Identicon);
