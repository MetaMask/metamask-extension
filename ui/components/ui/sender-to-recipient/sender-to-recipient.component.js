import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import copyToClipboard from 'copy-to-clipboard';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Name from '../../app/name/name';
import { Icon, IconName } from '../../component-library';
import AccountMismatchWarning from '../account-mismatch-warning/account-mismatch-warning.component';
import Identicon from '../identicon';
import Tooltip from '../tooltip';
import {
  CARDS_VARIANT,
  DEFAULT_VARIANT,
  FLAT_VARIANT,
} from './sender-to-recipient.constants';

const variantHash = {
  [DEFAULT_VARIANT]: 'sender-to-recipient--default',
  [CARDS_VARIANT]: 'sender-to-recipient--cards',
  [FLAT_VARIANT]: 'sender-to-recipient--flat',
};

function SenderAddress({
  addressOnly,
  checksummedSenderAddress,
  senderName,
  onSenderClick,
  senderAddress,
  warnUserOnAccountMismatch,
}) {
  const t = useI18nContext();
  const [addressCopied, setAddressCopied] = useState(false);
  let tooltipHtml = <p>{t('copiedExclamation')}</p>;
  if (!addressCopied) {
    tooltipHtml = addressOnly ? (
      <p>{t('copyAddress')}</p>
    ) : (
      <p>
        {shortenAddress(checksummedSenderAddress)}
        <br />
        {t('copyAddress')}
      </p>
    );
  }
  return (
    <div
      className={classnames(
        'sender-to-recipient__party sender-to-recipient__party--sender',
      )}
      onClick={() => {
        setAddressCopied(true);
        copyToClipboard(checksummedSenderAddress, COPY_OPTIONS);
        if (onSenderClick) {
          onSenderClick();
        }
      }}
    >
      <div className="sender-to-recipient__sender-icon">
        <Identicon
          address={toChecksumHexAddress(senderAddress)}
          diameter={24}
        />
      </div>
      <Tooltip
        position="bottom"
        html={tooltipHtml}
        wrapperClassName="sender-to-recipient__tooltip-wrapper"
        containerClassName="sender-to-recipient__tooltip-container"
        onHidden={() => setAddressCopied(false)}
      >
        <div className="sender-to-recipient__name">
          {addressOnly ? (
            <span>
              {`${senderName || shortenAddress(checksummedSenderAddress)}`}
            </span>
          ) : (
            senderName
          )}
        </div>
      </Tooltip>
      {warnUserOnAccountMismatch && (
        <AccountMismatchWarning address={senderAddress} />
      )}
    </div>
  );
}

SenderAddress.propTypes = {
  senderName: PropTypes.string,
  checksummedSenderAddress: PropTypes.string,
  addressOnly: PropTypes.bool,
  senderAddress: PropTypes.string,
  onSenderClick: PropTypes.func,
  warnUserOnAccountMismatch: PropTypes.bool,
};

export function RecipientWithAddress({
  checksummedRecipientAddress,
  onRecipientClick,
  addressOnly,
  recipientName,
  recipientIsOwnedAccount,
  chainId,
}) {
  const t = useI18nContext();
  const [addressCopied, setAddressCopied] = useState(false);

  let tooltipHtml = <p>{t('copiedExclamation')}</p>;
  if (!addressCopied) {
    tooltipHtml = addressOnly ? (
      <p>{t('copyAddress')}</p>
    ) : (
      <p>
        {shortenAddress(checksummedRecipientAddress)}
        <br />
        {t('copyAddress')}
      </p>
    );
  }

  return (
    <>
      <div
        className="sender-to-recipient__party sender-to-recipient__party--recipient sender-to-recipient__party--recipient-with-address"
        onClick={() => {
          if (recipientIsOwnedAccount) {
            setAddressCopied(true);
            copyToClipboard(checksummedRecipientAddress, COPY_OPTIONS);
          } else if (onRecipientClick) {
            onRecipientClick();
          }
        }}
      >
        <Tooltip
          position="bottom"
          disabled={!recipientName}
          html={tooltipHtml}
          wrapperClassName="sender-to-recipient__tooltip-wrapper"
          containerClassName="sender-to-recipient__tooltip-container"
          onHidden={() => setAddressCopied(false)}
        >
          <Name
            value={checksummedRecipientAddress}
            type={NameType.ETHEREUM_ADDRESS}
            variation={chainId}
          />
        </Tooltip>
      </div>
    </>
  );
}

RecipientWithAddress.propTypes = {
  checksummedRecipientAddress: PropTypes.string,
  recipientName: PropTypes.string,
  addressOnly: PropTypes.bool,
  onRecipientClick: PropTypes.func,
  recipientIsOwnedAccount: PropTypes.bool,
  chainId: PropTypes.string,
};

function Arrow({ variant }) {
  return variant === DEFAULT_VARIANT ? (
    <div className="sender-to-recipient__arrow-container">
      <div className="sender-to-recipient__arrow-circle">
        <i className="fa fa-arrow-right sender-to-recipient__arrow-circle__icon" />
      </div>
    </div>
  ) : (
    <div className="sender-to-recipient__arrow-container">
      <Icon name={IconName.ArrowRight} />
    </div>
  );
}

Arrow.propTypes = {
  variant: PropTypes.oneOf([DEFAULT_VARIANT, CARDS_VARIANT, FLAT_VARIANT]),
};

export default function SenderToRecipient({
  senderAddress,
  addressOnly,
  senderName,
  recipientName,
  onRecipientClick,
  onSenderClick,
  recipientAddress,
  variant,
  warnUserOnAccountMismatch,
  recipientIsOwnedAccount,
  chainId,
}) {
  const t = useI18nContext();
  const checksummedSenderAddress = toChecksumHexAddress(senderAddress);
  const checksummedRecipientAddress = toChecksumHexAddress(recipientAddress);

  return (
    <div
      className={classnames('sender-to-recipient', variantHash[variant])}
      data-testid="sender-to-recipient"
    >
      <SenderAddress
        checksummedSenderAddress={checksummedSenderAddress}
        addressOnly={addressOnly}
        senderName={senderName}
        onSenderClick={onSenderClick}
        senderAddress={senderAddress}
        warnUserOnAccountMismatch={warnUserOnAccountMismatch}
      />
      <Arrow variant={variant} />
      {recipientAddress ? (
        <RecipientWithAddress
          checksummedRecipientAddress={checksummedRecipientAddress}
          onRecipientClick={onRecipientClick}
          addressOnly={addressOnly}
          recipientName={recipientName}
          recipientIsOwnedAccount={recipientIsOwnedAccount}
          chainId={chainId}
        />
      ) : (
        <div className="sender-to-recipient__party sender-to-recipient__party--recipient">
          <i className="fa fa-file-text-o" />
          <div className="sender-to-recipient__name">{t('newContract')}</div>
        </div>
      )}
    </div>
  );
}

SenderToRecipient.defaultProps = {
  variant: DEFAULT_VARIANT,
  warnUserOnAccountMismatch: true,
};

SenderToRecipient.propTypes = {
  senderName: PropTypes.string,
  senderAddress: PropTypes.string,
  recipientName: PropTypes.string,
  recipientAddress: PropTypes.string,
  variant: PropTypes.oneOf([DEFAULT_VARIANT, CARDS_VARIANT, FLAT_VARIANT]),
  addressOnly: PropTypes.bool,
  onRecipientClick: PropTypes.func,
  onSenderClick: PropTypes.func,
  warnUserOnAccountMismatch: PropTypes.bool,
  recipientIsOwnedAccount: PropTypes.bool,
  chainId: PropTypes.string,
};
