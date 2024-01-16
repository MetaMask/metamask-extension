import React from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  TransactionGroupCategory,
  TransactionGroupStatus,
} from '../../../../shared/constants/transaction';
import { captureSingleException } from '../../../store/actions';
import { AvatarIcon, AvatarIconSize, IconName } from '../../component-library';
import {
  BackgroundColor,
  IconColor,
} from '../../../helpers/constants/design-system';

const ICON_MAP = {
  [TransactionGroupCategory.approval]: IconName.Check,
  [TransactionGroupCategory.interaction]: IconName.ProgrammingArrows,
  [TransactionGroupCategory.receive]: IconName.Received,
  [TransactionGroupCategory.send]: IconName.Arrow2UpRight,
  [TransactionGroupCategory.signatureRequest]: IconName.SecurityTick,
  [TransactionGroupCategory.swap]: IconName.SwapHorizontal,
};

const COLOR_MAP = {
  [TransactionGroupStatus.pending]: IconColor.primaryDefault,
  [TransactionGroupStatus.cancelled]: IconColor.errorDefault,
  [TransactionStatus.approved]: IconColor.primaryDefault,
  [TransactionStatus.dropped]: IconColor.errorDefault,
  [TransactionStatus.failed]: IconColor.errorDefault,
  [TransactionStatus.rejected]: IconColor.errorDefault,
  [TransactionStatus.submitted]: IconColor.primaryDefault,
  [TransactionStatus.unapproved]: IconColor.primaryDefault,
};

const BACKGROUND_COLOR_MAP = {
  [TransactionGroupStatus.pending]: BackgroundColor.primaryMuted,
  [TransactionGroupStatus.cancelled]: BackgroundColor.errorMuted,
  [TransactionStatus.approved]: BackgroundColor.primaryMuted,
  [TransactionStatus.dropped]: BackgroundColor.errorMuted,
  [TransactionStatus.failed]: BackgroundColor.errorMuted,
  [TransactionStatus.rejected]: BackgroundColor.errorMuted,
  [TransactionStatus.submitted]: BackgroundColor.primaryMuted,
  [TransactionStatus.unapproved]: BackgroundColor.primaryMuted,
};

export default function TransactionIcon({ status, category }) {
  const dispatch = useDispatch();

  const color = COLOR_MAP[status] || IconColor.primaryDefault;
  const backgroundColor =
    BACKGROUND_COLOR_MAP[status] || BackgroundColor.primaryMuted;
  const Icon = ICON_MAP[category];

  if (!Icon) {
    dispatch(
      captureSingleException(
        `The category prop passed to TransactionIcon is not supported. The prop is: ${category}`,
      ),
    );
    return (
      <AvatarIcon
        backgroundColor={BackgroundColor.backgroundAlternative}
        size={AvatarIconSize.Md}
      />
    );
  }

  return (
    <AvatarIcon
      backgroundColor={backgroundColor}
      iconName={Icon}
      size={AvatarIconSize.Md}
      color={color}
    />
  );
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
