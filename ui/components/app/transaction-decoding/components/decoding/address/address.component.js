import React, { useState } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { shortenAddress } from '../../../../../../helpers/utils/util';
import Identicon from '../../../../../ui/identicon';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

const Address = ({
  checksummedRecipientAddress,
  onRecipientClick,
  addressOnly,
  recipientNickname,
  recipientEns,
  recipientName,
  showNicknameModal,
}) => {
  const t = useI18nContext();
  const [addressCopied, setAddressCopied] = useState(false);

  let tooltipHtml = <p>{t('copiedExclamation')}</p>;
  if (!addressCopied) {
    tooltipHtml = '';
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
        onClick={() => {
          showNicknameModal(
            checksummedRecipientAddress,
            recipientNickname ? recipientNickname : null,
          );
        }}
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
    </div>
  );
};

Address.propTypes = {
  checksummedRecipientAddress: PropTypes.string,
  recipientName: PropTypes.string,
  recipientEns: PropTypes.string,
  recipientNickname: PropTypes.string,
  addressOnly: PropTypes.bool,
  onRecipientClick: PropTypes.func,
  showNicknameModal: PropTypes.func,
};

export default Address;
