import { connect } from 'react-redux';
import { getTokenList } from '../../../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../../../selectors/nft';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { ipfsGateway },
  } = state;

  return {
    tokenList: getTokenList(state),
    ipfsGateway,
    watchedNftContracts: getNftContractsByAddressOnCurrentChain(state),
  };
};

export default connect(mapStateToProps)(Identicon);
