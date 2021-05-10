import { connect } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentChecksumUsesChainId,
} from '../../../selectors';
import Identicon from './identicon.component';

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie },
  } = state;

  return {
    chainId: getCurrentChainId(state),
    checksumUsesChainId: getCurrentChecksumUsesChainId(state),
    useBlockie,
  };
};

export default connect(mapStateToProps)(Identicon);
