import { connect } from 'react-redux';
import * as actions from '../../../store/actions';
import SenderToRecipient from './sender-to-recipient.component';

function mapDispatchToProps(dispatch) {
  return {
    showNicknameModal: (address, nickname) =>
      dispatch(
        actions.showModal({
          name: 'SHOW_NICKNAME_MODAL',
          address,
          nickname,
        }),
      ),
  };
}

export default connect(null, mapDispatchToProps)(SenderToRecipient);
