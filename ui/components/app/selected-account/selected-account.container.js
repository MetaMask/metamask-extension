import { connect } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentChecksumUsesChainId,
  getSelectedIdentity,
} from '../../../selectors';
import SelectedAccount from './selected-account.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    checksumUsesChainId: getCurrentChecksumUsesChainId(state),
    selectedIdentity: getSelectedIdentity(state),
  };
};

export default connect(mapStateToProps)(SelectedAccount);
