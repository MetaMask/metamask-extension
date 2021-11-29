import { connect } from 'react-redux';
import * as actions from '../../../../../../store/actions';
import Address from './address.component';

function mapStateToProps(state, ownProps) {
  const { metamask } = state;

  const {
    addressBook,
    provider: { chainId },
  } = metamask;
  const address = ownProps.checksummedRecipientAddress;
  const addressBookEntryObject =
    addressBook && addressBook[chainId] && addressBook[chainId][address];

  return {
    recipientNickname: addressBookEntryObject?.name,
  };
}

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

export default connect(mapStateToProps, mapDispatchToProps)(Address);
