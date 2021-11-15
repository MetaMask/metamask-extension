import React, { useState } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import Tooltip from '../../../../ui/tooltip/tooltip';
import { shortenAddress } from '../../../../../helpers/utils/util';
import Identicon from '../../../../ui/identicon';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const Address = ({
  checksummedRecipientAddress,
  onRecipientClick,
  addressOnly,
  recipientNickname,
  recipientEns,
  recipientName,
}) => {
  const t = useI18nContext();
  const [addressCopied, setAddressCopied] = useState(false);

  let tooltipHtml = <p>{t('copiedExclamation')}</p>;
  if (!addressCopied) {
    if (addressOnly && !recipientNickname && !recipientEns) {
      tooltipHtml = <p>{t('copyAddress')}</p>;
    } else {
      tooltipHtml = (
        <p>
          {shortenAddress(checksummedRecipientAddress)}
          <br />
          {t('copyAddress')}
        </p>
      );
    }
  }
  return (
    <div
      className="sender-to-recipient__party sender-to-recipient__party--recipient sender-to-recipient__party--recipient-with-address"
      onClick={() => {
        setAddressCopied(true);
        copyToClipboard(checksummedRecipientAddress);
        if (onRecipientClick) {
          onRecipientClick();
        }
      }}
    >
      <div className="sender-to-recipient__sender-icon">
        <Identicon address={checksummedRecipientAddress} diameter={18} />
      </div>
      <Tooltip
        position="bottom"
        html={tooltipHtml}
        offset={-10}
        wrapperClassName="sender-to-recipient__tooltip-wrapper"
        containerClassName="sender-to-recipient__tooltip-container"
        onHidden={() => setAddressCopied(false)}
      >
        <div className="sender-to-recipient__name">
          {addressOnly
            ? recipientNickname ||
              recipientEns ||
              shortenAddress(checksummedRecipientAddress)
            : recipientNickname ||
              recipientEns ||
              recipientName ||
              t('newContract')}
        </div>
      </Tooltip>
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
};

export default Address;
