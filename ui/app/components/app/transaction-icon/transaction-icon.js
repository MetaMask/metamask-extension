import React from 'react'
import PropTypes from 'prop-types'
import Approve from '../../ui/icon/approve-icon.component'
import Interaction from '../../ui/icon/interaction-icon.component'
import Receive from '../../ui/icon/receive-icon.component'
import Send from '../../ui/icon/send-icon.component'
import Sign from '../../ui/icon/sign-icon.component'
import Swap from '../../ui/icon/swap-icon-for-list.component'
import {
  TRANSACTION_CATEGORY_APPROVAL,
  TRANSACTION_CATEGORY_SIGNATURE_REQUEST,
  TRANSACTION_CATEGORY_INTERACTION,
  TRANSACTION_CATEGORY_SEND,
  TRANSACTION_CATEGORY_RECEIVE,
  TRANSACTION_CATEGORY_SWAP,
  UNAPPROVED_STATUS,
  FAILED_STATUS,
  REJECTED_STATUS,
  CANCELLED_STATUS,
  DROPPED_STATUS,
  SUBMITTED_STATUS,
  APPROVED_STATUS,
} from '../../../helpers/constants/transactions'

const ICON_MAP = {
  [TRANSACTION_CATEGORY_APPROVAL]: Approve,
  [TRANSACTION_CATEGORY_INTERACTION]: Interaction,
  [TRANSACTION_CATEGORY_SEND]: Send,
  [TRANSACTION_CATEGORY_SIGNATURE_REQUEST]: Sign,
  [TRANSACTION_CATEGORY_RECEIVE]: Receive,
  [TRANSACTION_CATEGORY_SWAP]: Swap,
}

const FAIL_COLOR = '#D73A49'
const PENDING_COLOR = '#6A737D'
const OK_COLOR = '#2F80ED'

const COLOR_MAP = {
  [SUBMITTED_STATUS]: PENDING_COLOR,
  [UNAPPROVED_STATUS]: PENDING_COLOR,
  [APPROVED_STATUS]: PENDING_COLOR,
  [FAILED_STATUS]: FAIL_COLOR,
  [REJECTED_STATUS]: FAIL_COLOR,
  [CANCELLED_STATUS]: FAIL_COLOR,
  [DROPPED_STATUS]: FAIL_COLOR,
}

export default function TransactionIcon({ status, category }) {
  const color = COLOR_MAP[status] || OK_COLOR

  const Icon = ICON_MAP[category]

  return <Icon color={color} size={28} />
}

TransactionIcon.propTypes = {
  status: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
}
