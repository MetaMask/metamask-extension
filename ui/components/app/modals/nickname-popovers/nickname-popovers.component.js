import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { getMultichainAccountLink } from '../../../../helpers/utils/multichain/blockExplorer';
import { addToAddressBook } from '../../../../store/actions';
import { getAddressBook } from '../../../../selectors';
import NicknamePopover from '../../../ui/nickname-popover';
import UpdateNicknamePopover from '../../../ui/update-nickname-popover/update-nickname-popover';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  InternalAccountPropType,
  getMultichainNetwork,
} from '../../../../selectors/multichain';

const SHOW_NICKNAME_POPOVER = 'SHOW_NICKNAME_POPOVER';
const ADD_NICKNAME_POPOVER = 'ADD_NICKNAME_POPOVER';

const NicknamePopovers = ({ account, onClose }) => {
  const dispatch = useDispatch();

  const [popoverToDisplay, setPopoverToDisplay] = useState(
    SHOW_NICKNAME_POPOVER,
  );

  const addressBook = useSelector(getAddressBook);

  const addressBookEntryObject = addressBook.find(
    (entry) => entry.address === account.address,
  );

  const recipientNickname = addressBookEntryObject?.name;
  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    account,
  );

  const explorerLink = getMultichainAccountLink(account, multichainNetwork);

  if (popoverToDisplay === ADD_NICKNAME_POPOVER) {
    return (
      <UpdateNicknamePopover
        address={account.address}
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
      address={account.address}
      nickname={recipientNickname || null}
      onClose={onClose}
      onAdd={() => setPopoverToDisplay(ADD_NICKNAME_POPOVER)}
      explorerLink={explorerLink}
    />
  );
};

NicknamePopovers.propTypes = {
  account: InternalAccountPropType,
  onClose: PropTypes.func,
};

export default NicknamePopovers;
