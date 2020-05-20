import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../identicon'
import Tooltip from '../tooltip-v2'
import copyToClipboard from 'copy-to-clipboard'
import { DEFAULT_VARIANT, CARDS_VARIANT, FLAT_VARIANT } from './sender-to-recipient.constants'
import { checksumAddress, shortenAddress } from '../../../helpers/utils/util'
import { I18nContext } from '../../../contexts/i18n'

const variantHash = {
  [DEFAULT_VARIANT]: 'sender-to-recipient--default',
  [CARDS_VARIANT]: 'sender-to-recipient--cards',
  [FLAT_VARIANT]: 'sender-to-recipient--flat',
}

function SenderAddress ({
  addressOnly,
  checksummedSenderAddress,
  senderName,
  senderAddressCopied,
  setSenderAddressCopied,
}) {
  const t = useContext(I18nContext)
  let tooltipHtml = <p>{t('copiedExclamation')}</p>
  if (!senderAddressCopied) {
    tooltipHtml = addressOnly
      ? <p>{t('copyAddress')}</p>
      : (
        <p>
          {shortenAddress(checksummedSenderAddress)}<br />
          {t('copyAddress')}
        </p>
      )
  }
  return (
    <Tooltip
      position="bottom"
      html={tooltipHtml}
      wrapperClassName="sender-to-recipient__tooltip-wrapper"
      containerClassName="sender-to-recipient__tooltip-container"
      onHidden={() => setSenderAddressCopied(true)}
    >
      <div className="sender-to-recipient__name">
        {
          addressOnly
            ? <span>{`${t('from')}: ${senderName || checksummedSenderAddress}`}</span>
            : senderName
        }
      </div>
    </Tooltip>
  )
}

SenderAddress.propTypes = {
  senderName: PropTypes.string,
  checksummedSenderAddress: PropTypes.string,
  senderAddressCopied: PropTypes.bool,
  setSenderAddressCopied: PropTypes.func,
  addressOnly: PropTypes.bool,
}

function RecipientWithAddress ({
  checksummedRecipientAddress,
  senderAddressCopied,
  assetImage,
  onRecipientClick,
  addressOnly,
  recipientNickname,
  recipientEns,
  recipientName,
}) {
  const t = useContext(I18nContext)
  return (
    <div
      className="sender-to-recipient__party sender-to-recipient__party--recipient sender-to-recipient__party--recipient-with-address"
      onClick={() => {
        copyToClipboard(checksummedRecipientAddress)
        if (onRecipientClick) {
          onRecipientClick()
        }
      }}
    >
      {!addressOnly && (
        <div className="sender-to-recipient__sender-icon">
          <Identicon
            address={checksummedRecipientAddress}
            diameter={24}
            image={assetImage}
          />
        </div>
      )}
      <Tooltip
        position="bottom"
        html={
          senderAddressCopied
            ? <p>{t('copiedExclamation')}</p>
            : (addressOnly && !recipientNickname && !recipientEns)
              ? <p>{t('copyAddress')}</p>
              : (
                <p>
                  {shortenAddress(checksummedRecipientAddress)}<br />
                  {t('copyAddress')}
                </p>
              )
        }
        wrapperClassName="sender-to-recipient__tooltip-wrapper"
        containerClassName="sender-to-recipient__tooltip-container"
      >
        <div className="sender-to-recipient__name">
          <span>{ addressOnly ? `${t('to')}: ` : '' }</span>
          {
            addressOnly
              ? (recipientNickname || recipientEns || checksummedRecipientAddress)
              : (recipientNickname || recipientEns || recipientName || t('newContract'))
          }
        </div>
      </Tooltip>
    </div>
  )
}

RecipientWithAddress.propTypes = {
  checksummedRecipientAddress: PropTypes.string,
  recipientName: PropTypes.string,
  recipientEns: PropTypes.string,
  senderAddressCopied: PropTypes.bool,
  recipientNickname: PropTypes.string,
  addressOnly: PropTypes.bool,
  assetImage: PropTypes.string,
  onRecipientClick: PropTypes.func,
}


function Arrow ({ variant }) {
  return variant === DEFAULT_VARIANT
    ? (
      <div className="sender-to-recipient__arrow-container">
        <div className="sender-to-recipient__arrow-circle">
          <img
            height={15}
            width={15}
            src="./images/arrow-right.svg"
          />
        </div>
      </div>
    ) : (
      <div className="sender-to-recipient__arrow-container">
        <img
          height={20}
          src="./images/caret-right.svg"
        />
      </div>
    )
}

Arrow.propTypes = {
  variant: PropTypes.oneOf([DEFAULT_VARIANT, CARDS_VARIANT, FLAT_VARIANT]),
}

export default function SenderToRecipient ({
  senderAddress,
  addressOnly,
  assetImage,
  senderName,
  recipientNickname,
  recipientName,
  recipientEns,
  onRecipientClick,
  onSenderClick,
  recipientAddress,
  variant = DEFAULT_VARIANT,
}) {
  const [senderAddressCopied, setSenderAddressCopied] = useState(false)
  const t = useContext(I18nContext)
  const checksummedSenderAddress = checksumAddress(senderAddress)
  const checksummedRecipientAddress = checksumAddress(recipientAddress)

  return (
    <div className={classnames('sender-to-recipient', variantHash[variant])}>
      <div
        className={classnames('sender-to-recipient__party sender-to-recipient__party--sender')}
        onClick={() => {
          setSenderAddressCopied(true)
          copyToClipboard(checksummedSenderAddress)
          if (onSenderClick) {
            onSenderClick()
          }
        }}
      >
        {!addressOnly && (
          <div className="sender-to-recipient__sender-icon">
            <Identicon
              address={checksumAddress(senderAddress)}
              diameter={24}
            />
          </div>
        )}
        <SenderAddress
          checksummedSenderAddress={checksummedSenderAddress}
          addressOnly={addressOnly}
          senderName={senderName}
          senderAddressCopied={senderAddressCopied}
          setSenderAddressCopied={setSenderAddressCopied}
        />
        <AccountMismatchWarning address={senderAddress} />
      </div>
      <Arrow variant={variant} />

      {recipientAddress
        ? (
          <RecipientWithAddress
            assetImage={assetImage}
            checksummedRecipientAddress={checksummedRecipientAddress}
            senderAddressCopied={senderAddressCopied}
            onRecipientClick={onRecipientClick}
            addressOnly={addressOnly}
            recipientNickname={recipientNickname}
            recipientEns={recipientEns}
            recipientName={recipientName}
          />
        )
        : (
          <div className="sender-to-recipient__party sender-to-recipient__party--recipient">
            { !addressOnly && <i className="fa fa-file-text-o" /> }
            <div className="sender-to-recipient__name">
              {t('newContract') }
            </div>
          </div>
        )
      }
    </div>
  )
}

SenderToRecipient.propTypes = {
  senderName: PropTypes.string,
  senderAddress: PropTypes.string,
  recipientName: PropTypes.string,
  recipientEns: PropTypes.string,
  recipientAddress: PropTypes.string,
  recipientNickname: PropTypes.string,
  variant: PropTypes.oneOf([DEFAULT_VARIANT, CARDS_VARIANT, FLAT_VARIANT]),
  addressOnly: PropTypes.bool,
  assetImage: PropTypes.string,
  onRecipientClick: PropTypes.func,
  onSenderClick: PropTypes.func,
}
