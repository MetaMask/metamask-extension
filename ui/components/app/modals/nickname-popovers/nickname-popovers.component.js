import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { getMultichainAccountUrl } from '../../../../helpers/utils/multichain/blockExplorer';
import { addToAddressBook } from '../../../../store/actions';
import {
  getAddressBook,
  getInternalAccountByAddress,
} from '../../../../selectors';
import NicknamePopover from '../../../ui/nickname-popover';
import UpdateNicknamePopover from '../../../ui/update-nickname-popover/update-nickname-popover';
import { getMultichainNetwork } from '../../../../selectors/multichain';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';

const SHOW_NICKNAME_POPOVER = 'SHOW_NICKNAME_POPOVER';
const ADD_NICKNAME_POPOVER = 'ADD_NICKNAME_POPOVER';

const NicknamePopovers = ({ address, onClose }) => {
  const dispatch = useDispatch();

  const [popoverToDisplay, setPopoverToDisplay] = useState(
    SHOW_NICKNAME_POPOVER,
  );

  const addressBook = useSelector(getAddressBook);

  const addressBookEntryObject = addressBook.find(
    (entry) => entry.address === address,
  );

  const recipientNickname = addressBookEntryObject?.name;

  // This may be undefined because the address may be a contract address
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );

  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    account,
  );

  const explorerLink = getMultichainAccountUrl(address, multichainNetwork);

  if (popoverToDisplay === ADD_NICKNAME_POPOVER) {
    return (
      <UpdateNicknamePopover
        address={address}
        nickname={recipientNickname || null}
        memo={addressBookEntryObject?.memo || null}
        onClose={() => setPopoverToDisplay(SHOW_NICKNAME_POPOVER)}
        onAdd={(recipient, nickname, memo) =>
          dispatch(addToAddressBook(recipient, nickname, memo))
        }
      />
    );
  }

  // SHOW_NICKNAME_POPOVER case
  return (
    <NicknamePopover
      address={address}
      nickname={recipientNickname || null}
      onClose={onClose}
      onAdd={() => setPopoverToDisplay(ADD_NICKNAME_POPOVER)}
      explorerLink={explorerLink}
    />
  );
};

NicknamePopovers.propTypes = {
  address: PropTypes.string,
  onClose: PropTypes.func,
};

export default NicknamePopovers;
