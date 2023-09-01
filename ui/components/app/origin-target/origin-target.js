import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import { useDispatch } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { getProposedNames } from '../../../store/actions';
import Name from '../names/name/name';
import { TextVariant } from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';
import Identicon from '../../ui/identicon/identicon.component';
import Tooltip from '../../ui/tooltip/tooltip';
import AccountMismatchWarning from '../../ui/account-mismatch-warning/account-mismatch-warning.component';

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
      className="origin-target__origin"
      onClick={() => {
        setAddressCopied(true);
        copyToClipboard(checksummedSenderAddress);
        if (onSenderClick) {
          onSenderClick();
        }
      }}
    >
      <div className="origin-target__sender-icon">
        <Identicon
          address={toChecksumHexAddress(senderAddress)}
          diameter={24}
        />
      </div>
      <Tooltip
        position="bottom"
        html={tooltipHtml}
        wrapperClassName="origin-target__tooltip-wrapper"
        containerClassName="origin-target__tooltip-container"
        onHidden={() => setAddressCopied(false)}
      >
        <div className="origin-target__name">
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

export function RecipientWithAddress({ checksummedRecipientAddress }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      getProposedNames({
        value: checksummedRecipientAddress,
        type: NameType.ETHEREUM_ADDRESS,
      }),
    );
  }, [checksummedRecipientAddress, dispatch]);

  return (
    <Name
      value={checksummedRecipientAddress}
      type={NameType.ETHEREUM_ADDRESS}
      providerPriority={['lens', 'token', 'ens', 'etherscan']}
    />
  );
}

RecipientWithAddress.propTypes = {
  checksummedRecipientAddress: PropTypes.string,
};

export default function OriginTarget({
  senderAddress,
  addressOnly,
  senderName,
  recipientNickname,
  recipientName,
  recipientMetadataName,
  recipientEns,
  onRecipientClick,
  onSenderClick,
  recipientAddress,
  warnUserOnAccountMismatch,
  recipientIsOwnedAccount,
}) {
  const t = useI18nContext();
  const checksummedSenderAddress = toChecksumHexAddress(senderAddress);
  const checksummedRecipientAddress = toChecksumHexAddress(recipientAddress);

  return (
    <div data-testid="origin-target">
      <div className="origin-target__container">
        <div className="origin-target__origin-row">
          <Text
            className="origin-target__row-name"
            variant={TextVariant.bodyMd}
          >
            Origin
          </Text>
          <div></div>
          <SenderAddress
            checksummedSenderAddress={checksummedSenderAddress}
            addressOnly={addressOnly}
            senderName={senderName}
            onSenderClick={onSenderClick}
            senderAddress={senderAddress}
            warnUserOnAccountMismatch={warnUserOnAccountMismatch}
          />
        </div>
        <div className="origin-target__target-row">
          <Text
            className="origin-target__row-name"
            variant={TextVariant.bodyMd}
          >
            Target
          </Text>
          {recipientAddress ? (
            <RecipientWithAddress
              checksummedRecipientAddress={checksummedRecipientAddress}
              onRecipientClick={onRecipientClick}
              addressOnly={addressOnly}
              recipientNickname={recipientNickname}
              recipientEns={recipientEns}
              recipientName={recipientName}
              recipientMetadataName={recipientMetadataName}
              recipientIsOwnedAccount={recipientIsOwnedAccount}
            />
          ) : (
            <div>
              <i className="fa fa-file-text-o" />
              <div className="origin-target__name">{t('newContract')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

OriginTarget.defaultProps = {
  warnUserOnAccountMismatch: true,
};

OriginTarget.propTypes = {
  senderName: PropTypes.string,
  senderAddress: PropTypes.string,
  recipientName: PropTypes.string,
  recipientMetadataName: PropTypes.string,
  recipientEns: PropTypes.string,
  recipientAddress: PropTypes.string,
  recipientNickname: PropTypes.string,
  addressOnly: PropTypes.bool,
  onRecipientClick: PropTypes.func,
  onSenderClick: PropTypes.func,
  warnUserOnAccountMismatch: PropTypes.bool,
  recipientIsOwnedAccount: PropTypes.bool,
};
