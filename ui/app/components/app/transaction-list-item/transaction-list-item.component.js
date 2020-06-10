import React, { useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import ListItem from '../../ui/list-item'
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData'
import Approve from '../../ui/icon/approve-icon.component'
import Interaction from '../../ui/icon/interaction-icon.component'
import Receive from '../../ui/icon/receive-icon.component'
import Preloader from '../../ui/icon/preloader'
import Send from '../../ui/icon/send-icon.component'
import { useI18nContext } from '../../../hooks/useI18nContext'
import { useCancelTransaction } from '../../../hooks/useCancelTransaction'
import { useRetryTransaction } from '../../../hooks/useRetryTransaction'
import Button from '../../ui/button'
import Tooltip from '../../ui/tooltip'
import TransactionListItemDetails from '../transaction-list-item-details'
import { useHistory } from 'react-router-dom'
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes'
import {
  TRANSACTION_CATEGORY_APPROVAL,
  TRANSACTION_CATEGORY_SIGNATURE_REQUEST,
  TRANSACTION_CATEGORY_INTERACTION,
  TRANSACTION_CATEGORY_SEND,
  TRANSACTION_CATEGORY_RECEIVE,
  UNAPPROVED_STATUS,
  FAILED_STATUS,
  CANCELLED_STATUS,
} from '../../../helpers/constants/transactions'
import { useShouldShowSpeedUp } from '../../../hooks/useShouldShowSpeedUp'
import Sign from '../../ui/icon/sign-icon.component'


export default function TransactionListItem ({ transactionGroup, isEarliestNonce = false }) {
  const t = useI18nContext()
  const history = useHistory()
  const { hasCancelled } = transactionGroup
  const [showDetails, setShowDetails] = useState(false)

  const { initialTransaction: { id } } = transactionGroup

  const [cancelEnabled, cancelTransaction] = useCancelTransaction(transactionGroup)
  const retryTransaction = useRetryTransaction(transactionGroup)
  const shouldShowSpeedUp = useShouldShowSpeedUp(transactionGroup, isEarliestNonce)

  const {
    title,
    subtitle,
    date,
    category,
    primaryCurrency,
    recipientAddress,
    secondaryCurrency,
    status,
    isPending,
    senderAddress,
  } = useTransactionDisplayData(transactionGroup)

  const isApprove = category === TRANSACTION_CATEGORY_APPROVAL
  const isSignatureReq = category === TRANSACTION_CATEGORY_SIGNATURE_REQUEST
  const isInteraction = category === TRANSACTION_CATEGORY_INTERACTION
  const isSend = category === TRANSACTION_CATEGORY_SEND
  const isReceive = category === TRANSACTION_CATEGORY_RECEIVE
  const isUnapproved = status === UNAPPROVED_STATUS
  const isFailed = status === FAILED_STATUS
  const isCancelled = status === CANCELLED_STATUS

  const color = isFailed ? '#D73A49' : '#2F80ED'

  let Icon
  if (isApprove) {
    Icon = Approve
  } else if (isSend) {
    Icon = Send
  } else if (isReceive) {
    Icon = Receive
  } else if (isInteraction) {
    Icon = Interaction
  } else if (isSignatureReq) {
    Icon = Sign
  }

  let subtitleStatus = <span><span className="transaction-list-item__date">{date}</span> · </span>
  if (isUnapproved) {
    subtitleStatus = (
      <span><span className="transaction-list-item__status--unapproved">{t('unapproved')}</span> · </span>
    )
  } else if (isFailed) {
    subtitleStatus = (
      <span><span className="transaction-list-item__status--failed">{t('failed')}</span> · </span>
    )
  } else if (isCancelled) {
    subtitleStatus = (
      <span><span className="transaction-list-item__status--cancelled">{t('cancelled')}</span> · </span>
    )
  } else if (isPending && !isEarliestNonce) {
    subtitleStatus = (
      <span><span className="transaction-list-item__status--queued">{t('queued')}</span> · </span>
    )
  }

  const className = classnames('transaction-list-item', { 'transaction-list-item--pending': isPending })

  const toggleShowDetails = useCallback(() => {
    if (isUnapproved) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`)
      return
    }
    setShowDetails((prev) => !prev)
  }, [isUnapproved, history, id])

  const cancelButton = useMemo(() => {
    const cancelButton = (
      <Button
        onClick={cancelTransaction}
        rounded
        className="transaction-list-item__header-button"
        disabled={!cancelEnabled}
      >
        { t('cancel') }
      </Button>
    )
    if (hasCancelled || !isPending || isUnapproved) {
      return null
    }

    return !cancelEnabled ? (
      <Tooltip title={t('notEnoughGas')}>
        <div>
          {cancelButton}
        </div>
      </Tooltip>
    ) : cancelButton

  }, [isPending, t, isUnapproved, cancelEnabled, cancelTransaction, hasCancelled])

  const speedUpButton = useMemo(() => {
    if (!shouldShowSpeedUp || !isPending || isUnapproved) {
      return null
    }
    return (
      <Button
        type="secondary"
        rounded
        onClick={retryTransaction}
        className="transaction-list-item-details__header-button"
      >
        { t('speedUp') }
      </Button>
    )
  }, [shouldShowSpeedUp, isUnapproved, t, isPending, retryTransaction])

  return (
    <>
      <ListItem
        onClick={toggleShowDetails}
        className={className}
        title={title}
        titleIcon={!isUnapproved && isPending && isEarliestNonce && (
          <Preloader
            size={16}
            color="#D73A49"
          />
        )}
        icon={<Icon color={color} size={28} />}
        subtitle={subtitle}
        subtitleStatus={subtitleStatus}
        rightContent={!isSignatureReq && (
          <>
            <h2 className="transaction-list-item__primary-currency">{primaryCurrency}</h2>
            <h3 className="transaction-list-item__secondary-currency">{secondaryCurrency}</h3>
          </>
        )}
      >
        <div className="transaction-list-item__pending-actions">
          {speedUpButton}
          {cancelButton}
        </div>
      </ListItem>
      {showDetails && (
        <TransactionListItemDetails
          title={title}
          onClose={toggleShowDetails}
          transactionGroup={transactionGroup}
          senderAddress={senderAddress}
          recipientAddress={recipientAddress}
          onRetry={retryTransaction}
          showRetry={isFailed}
          showSpeedUp={shouldShowSpeedUp}
          isEarliestNonce={isEarliestNonce}
          onCancel={cancelTransaction}
          showCancel={isPending && !hasCancelled}
          cancelDisabled={!cancelEnabled}
        />
      )}
    </>
  )
}

TransactionListItem.propTypes = {
  transactionGroup: PropTypes.object.isRequired,
  isEarliestNonce: PropTypes.bool,
}
