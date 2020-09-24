import React from 'react'
import PropTypes from 'prop-types'
import Approve from '../../ui/icon/approve-icon.component'
import Interaction from '../../ui/icon/interaction-icon.component'
import Receive from '../../ui/icon/receive-icon.component'
import Send from '../../ui/icon/send-icon.component'
import Sign from '../../ui/icon/sign-icon.component'
import Swap from '../../ui/icon/swap-icon-for-list.component'
import {
  TRANSACTION_GROUP_CATEGORY_APPROVAL,
  TRANSACTION_GROUP_CATEGORY_INTERACTION,
  TRANSACTION_GROUP_CATEGORY_RECEIVE,
  TRANSACTION_GROUP_CATEGORY_SEND,
  TRANSACTION_GROUP_CATEGORY_SIGNATURE_REQUEST,
  TRANSACTION_GROUP_CATEGORY_SWAP,
  TRANSACTION_GROUP_STATUS_CANCELLED,
  TRANSACTION_GROUP_STATUS_PENDING,
  TRANSACTION_STATUS_APPROVED,
  TRANSACTION_STATUS_DROPPED,
  TRANSACTION_STATUS_FAILED,
  TRANSACTION_STATUS_REJECTED,
  TRANSACTION_STATUS_UNAPPROVED,
} from '../../../../../shared/constants/transaction'

const ICON_MAP = {
  [TRANSACTION_GROUP_CATEGORY_APPROVAL]: Approve,
  [TRANSACTION_GROUP_CATEGORY_INTERACTION]: Interaction,
  [TRANSACTION_GROUP_CATEGORY_SEND]: Send,
  [TRANSACTION_GROUP_CATEGORY_SIGNATURE_REQUEST]: Sign,
  [TRANSACTION_GROUP_CATEGORY_RECEIVE]: Receive,
  [TRANSACTION_GROUP_CATEGORY_SWAP]: Swap,

}

const FAIL_COLOR = '#D73A49'
const PENDING_COLOR = '#6A737D'
const OK_COLOR = '#2F80ED'

const COLOR_MAP = {
  [TRANSACTION_GROUP_STATUS_PENDING]: PENDING_COLOR,
  [TRANSACTION_STATUS_UNAPPROVED]: PENDING_COLOR,
  [TRANSACTION_STATUS_APPROVED]: PENDING_COLOR,
  [TRANSACTION_STATUS_FAILED]: FAIL_COLOR,
  [TRANSACTION_STATUS_REJECTED]: FAIL_COLOR,
  [TRANSACTION_GROUP_STATUS_CANCELLED]: FAIL_COLOR,
  [TRANSACTION_STATUS_DROPPED]: FAIL_COLOR,
}

export default function TransactionIcon ({ status, category }) {

  const color = COLOR_MAP[status] || OK_COLOR

  const Icon = ICON_MAP[category]

  return <Icon color={color} size={28} />
}

TransactionIcon.propTypes = {
  status: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
}
