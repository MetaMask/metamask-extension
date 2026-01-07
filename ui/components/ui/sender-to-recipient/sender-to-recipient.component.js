import { NameType } from '@metamask/name-controller';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { AvatarAccountSize, TextVariant } from '@metamask/design-system-react';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Name from '../../app/name/name';
import { Icon, IconName } from '../../component-library';
import AccountMismatchWarning from '../account-mismatch-warning/account-mismatch-warning.component';
import { PreferredAvatar } from '../../app/preferred-avatar';
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
  senderAddress,
  warnUserOnAccountMismatch,
}) {
  return (
    <div className="sender-to-recipient__party sender-to-recipient__party--sender gap-1">
      <PreferredAvatar
        address={toChecksumHexAddress(senderAddress)}
        size={AvatarAccountSize.Sm}
      />
      <div className="sender-to-recipient__name text-s-body-xs">
        {addressOnly ? (
          <span>
            {`${senderName || shortenAddress(checksummedSenderAddress)}`}
          </span>
        ) : (
          senderName
        )}
      </div>
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
  warnUserOnAccountMismatch: PropTypes.bool,
};

export function RecipientWithAddress({
  checksummedRecipientAddress,
  chainId,
  className = '',
}) {
  return (
    <>
      <div
        className={classnames(
          'sender-to-recipient__party sender-to-recipient__party--recipient sender-to-recipient__party--recipient-with-address',
          className,
        )}
      >
        <Name
          value={checksummedRecipientAddress}
          type={NameType.ETHEREUM_ADDRESS}
          variation={chainId}
          variant={TextVariant.BodyXs}
        />
      </div>
    </>
  );
}

RecipientWithAddress.propTypes = {
  checksummedRecipientAddress: PropTypes.string,
  chainId: PropTypes.string,
  className: PropTypes.string,
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
  recipientAddress,
  variant,
  warnUserOnAccountMismatch,
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
        senderAddress={senderAddress}
        warnUserOnAccountMismatch={warnUserOnAccountMismatch}
      />
      <Arrow variant={variant} />
      {recipientAddress ? (
        <RecipientWithAddress
          className="justify-end"
          checksummedRecipientAddress={checksummedRecipientAddress}
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
  recipientAddress: PropTypes.string,
  variant: PropTypes.oneOf([DEFAULT_VARIANT, CARDS_VARIANT, FLAT_VARIANT]),
  addressOnly: PropTypes.bool,
  warnUserOnAccountMismatch: PropTypes.bool,
  chainId: PropTypes.string,
};
