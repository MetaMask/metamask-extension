import React from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Approve from '../../ui/icon/approve-icon.component';
import Interaction from '../../ui/icon/interaction-icon.component';
import Receive from '../../ui/icon/receive-icon.component';
import Send from '../../ui/icon/send-icon.component';
import Sign from '../../ui/icon/sign-icon.component';
import Swap from '../../ui/icon/swap-icon-for-list.component';
import {
  TransactionGroupCategory,
  TransactionGroupStatus,
  TransactionStatus,
} from '../../../../shared/constants/transaction';
import { captureSingleException } from '../../../store/actions';

const ICON_MAP = {
  [TransactionGroupCategory.approval]: Approve,
  [TransactionGroupCategory.interaction]: Interaction,
  [TransactionGroupCategory.receive]: Receive,
  [TransactionGroupCategory.send]: Send,
  [TransactionGroupCategory.signatureRequest]: Sign,
  [TransactionGroupCategory.swap]: Swap,
};

const FAIL_COLOR = 'var(--color-error-default)';
const PENDING_COLOR = 'var(--color-icon-default)';
const OK_COLOR = 'var(--color-primary-default)';

const COLOR_MAP = {
  [TransactionGroupStatus.pending]: PENDING_COLOR,
  [TransactionGroupStatus.cancelled]: FAIL_COLOR,
  [TransactionStatus.approved]: PENDING_COLOR,
  [TransactionStatus.dropped]: FAIL_COLOR,
  [TransactionStatus.failed]: FAIL_COLOR,
  [TransactionStatus.rejected]: FAIL_COLOR,
  [TransactionStatus.submitted]: PENDING_COLOR,
  [TransactionStatus.unapproved]: PENDING_COLOR,
};

export default function TransactionIcon({ status, category }) {
  const dispatch = useDispatch();

  const color = COLOR_MAP[status] || OK_COLOR;
  const Icon = ICON_MAP[category];

  if (!Icon) {
    dispatch(
      captureSingleException(
        `The category prop passed to TransactionIcon is not supported. The prop is: ${category}`,
      ),
    );
    return <div className="transaction-icon__grey-circle" />;
  }

  return <Icon color={color} size={28} />;
}

TransactionIcon.propTypes = {
  status: PropTypes.oneOf([
    TransactionGroupStatus.cancelled,
    TransactionGroupStatus.pending,
    TransactionStatus.approved,
    TransactionStatus.confirmed,
    TransactionStatus.dropped,
    TransactionStatus.failed,
    TransactionStatus.rejected,
    TransactionStatus.submitted,
    TransactionStatus.unapproved,
  ]).isRequired,
  category: PropTypes.oneOf([
    TransactionGroupCategory.approval,
    TransactionGroupCategory.interaction,
    TransactionGroupCategory.receive,
    TransactionGroupCategory.send,
    TransactionGroupCategory.signatureRequest,
    TransactionGroupCategory.swap,
  ]).isRequired,
};
