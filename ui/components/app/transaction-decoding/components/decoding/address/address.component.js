import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { getAccountLink } from '@metamask/etherscan-link';
import { shortenAddress } from '../../../../../../helpers/utils/util';
import Identicon from '../../../../../ui/identicon';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  getAddressBook,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../../../../selectors';
import NicknamePopover from '../../../../../ui/nickname-popover';
import UpdateNicknamePopover from '../../../../../ui/update-nickname-popover';
import { addToAddressBook } from '../../../../../../store/actions';

const SHOW_NICKNAME_POPOVER = 'SHOW_NICKNAME_POPOVER';
const ADD_NICKNAME_POPOVER = 'ADD_NICKNAME_POPOVER';

const Address = ({
  checksummedRecipientAddress,
  onRecipientClick,
  addressOnly,
  recipientEns,
  recipientName,
}) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const [addressCopied, setAddressCopied] = useState(false);
  const [popoverToDisplay, setPopoverToDisplay] = useState(null);

  const addressBook = useSelector(getAddressBook);
  const chainId = useSelector(getCurrentChainId);
  const addressBookEntryObject =
    addressBook &&
    addressBook[chainId] &&
    addressBook[chainId][checksummedRecipientAddress];
  const recipientNickname = addressBookEntryObject?.name;

  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const explorerLink = getAccountLink(
    checksummedRecipientAddress,
    chainId,
    { blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null },
    null,
  );

  let tooltipHtml = <p>{t('copiedExclamation')}</p>;
  if (!addressCopied) {
    tooltipHtml = '';
  }

  let popover = null;

  if (popoverToDisplay === SHOW_NICKNAME_POPOVER) {
    popover = (
      <NicknamePopover
        address={checksummedRecipientAddress}
        onClose={() => setPopoverToDisplay(null)}
        onAdd={() => setPopoverToDisplay(ADD_NICKNAME_POPOVER)}
        nickname={recipientNickname || null}
        explorerLink={explorerLink}
      />
    );
  } else if (popoverToDisplay === ADD_NICKNAME_POPOVER) {
    popover = (
      <UpdateNicknamePopover
        address={checksummedRecipientAddress}
        nickname={recipientNickname || null}
        memo={addressBookEntryObject?.memo}
        onClose={() => setPopoverToDisplay(null)}
        onAdd={(recipient, nickname, memo) =>
          dispatch(addToAddressBook(recipient, nickname, memo))
        }
      />
    );
  }

  return (
    <div
      className="tx-insight tx-insight-component tx-insight-component-address"
      onClick={() => {
        setAddressCopied(true);
        copyToClipboard(checksummedRecipientAddress);
        if (onRecipientClick) {
          onRecipientClick();
        }
      }}
    >
      <div className="tx-insight-component-address__sender-icon">
        <Identicon address={checksummedRecipientAddress} diameter={18} />
      </div>

      <div
        className="address__name"
        onClick={() => setPopoverToDisplay(SHOW_NICKNAME_POPOVER)}
      >
        {addressOnly
          ? recipientNickname ||
            recipientEns ||
            shortenAddress(checksummedRecipientAddress)
          : recipientNickname ||
            recipientEns ||
            recipientName ||
            t('newContract')}
      </div>
      {popover}
    </div>
  );
};

Address.propTypes = {
  checksummedRecipientAddress: PropTypes.string,
  recipientName: PropTypes.string,
  recipientEns: PropTypes.string,
  addressOnly: PropTypes.bool,
  onRecipientClick: PropTypes.func,
};

export default Address;
