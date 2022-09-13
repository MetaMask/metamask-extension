import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { shortenAddress } from '../../../../../../helpers/utils/util';
import Identicon from '../../../../../ui/identicon';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getAddressBook } from '../../../../../../selectors';
import NicknamePopovers from '../../../../modals/nickname-popovers';

const Address = ({
  checksummedRecipientAddress,
  onRecipientClick,
  addressOnly,
  recipientEns,
  recipientName,
}) => {
  const t = useI18nContext();
  const [showNicknamePopovers, setShowNicknamePopovers] = useState(false);

  const addressBook = useSelector(getAddressBook);
  const addressBookEntryObject = addressBook.find(
    (entry) => entry.address === checksummedRecipientAddress,
  );
  const recipientNickname = addressBookEntryObject?.name;

  const recipientToRender = addressOnly
    ? recipientNickname ||
      recipientEns ||
      shortenAddress(checksummedRecipientAddress)
    : recipientNickname || recipientEns || recipientName || t('newContract');

  return (
    <div
      className="tx-insight tx-insight-component tx-insight-component-address"
      onClick={() => {
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
        onClick={() => setShowNicknamePopovers(true)}
      >
        {recipientToRender}
      </div>
      {showNicknamePopovers ? (
        <NicknamePopovers
          onClose={() => setShowNicknamePopovers(false)}
          address={checksummedRecipientAddress}
        />
      ) : null}
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
