import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import { addToAddressBook } from '../../../../store/actions';
import {
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
  getAddressBook,
} from '../../../../selectors';
import NicknamePopover from '../../../ui/nickname-popover';
import UpdateNicknamePopover from '../../../ui/update-nickname-popover/update-nickname-popover';

const SHOW_NICKNAME_POPOVER = 'SHOW_NICKNAME_POPOVER';
const ADD_NICKNAME_POPOVER = 'ADD_NICKNAME_POPOVER';

const NicknamePopovers = ({ address, onClose }) => {
  const dispatch = useDispatch();

  const [popoverToDisplay, setPopoverToDisplay] = useState(
    SHOW_NICKNAME_POPOVER,
  );

  const addressBook = useSelector(getAddressBook);
  const chainId = useSelector(getCurrentChainId);

  const addressBookEntryObject = addressBook.find(
    (entry) => entry.address === address,
  );

  const recipientNickname = addressBookEntryObject?.name;
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const explorerLink = getAccountLink(
    address,
    chainId,
    { blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null },
    null,
  );

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
