import { connect } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentChecksumUsesChainId,
} from '../../../selectors';
import SenderToRecipient from './sender-to-recipient.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    checksumUsesChainId: getCurrentChecksumUsesChainId(state),
  };
};

export default connect(mapStateToProps)(SenderToRecipient);
