import { connect } from 'react-redux';
import { getTokenList } from '../../../selectors';
import { getNftContractsOnCurrentChain } from '../../../ducks/metamask/metamask';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, ipfsGateway },
  } = state;

  return {
    useBlockie,
    tokenList: getTokenList(state),
    ipfsGateway,
    watchedNftContracts: getNftContractsOnCurrentChain(state),
  };
};

export default connect(mapStateToProps)(Identicon);
