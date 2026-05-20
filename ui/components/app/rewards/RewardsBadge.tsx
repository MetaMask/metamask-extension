import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setRewardsBadgeHidden } from '../../../ducks/rewards';
import { setStorageItem } from '../../../../shared/lib/storage-helpers';
import { REWARDS_BADGE_HIDDEN } from './utils/constants';
import { RewardsIcon, RewardsIconVariant } from './RewardsIcon';

export const RewardsBadge = ({
  formattedPoints,
  boxClassName,
  textClassName,
  withPointsSuffix = true,
  useAlternativeIconColor = false,
  allowHideBadge = false,
  startIconName,
  onClick,
}: {
  formattedPoints: string;
  boxClassName?: string;
  textClassName?: string;
  withPointsSuffix?: boolean;
  useAlternativeIconColor?: boolean;
  allowHideBadge?: boolean;
  startIconName?: IconName;
  onClick?: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [isHovered, setIsHovered] = useState(false);

  const handleClose = useCallback(() => {
    setIsHovered(false);
    dispatch(setRewardsBadgeHidden(true));
    try {
      setStorageItem(REWARDS_BADGE_HIDDEN, 'true');
    } catch (_e) {
      // Silently fail - should not block the user from seeing the points balance
    }
  }, [dispatch]);

  return (
    <Box
      className={`relative flex items-center${boxClassName ? ` ${boxClassName}` : ''}${onClick ? ' cursor-pointer' : ''}`}
      data-testid="rewards-points-balance"
      onMouseEnter={allowHideBadge ? () => setIsHovered(true) : undefined}
      onMouseLeave={allowHideBadge ? () => setIsHovered(false) : undefined}
    >
      <Box className="flex items-center gap-1" onClick={onClick}>
        <RewardsIcon
          variant={
            useAlternativeIconColor
              ? RewardsIconVariant.Alternative
              : RewardsIconVariant.Default
          }
          startIconName={startIconName}
        />
        <Text
          variant={TextVariant.BodySm}
          className={textClassName}
          data-testid="rewards-points-balance-value"
        >
          {withPointsSuffix
            ? t('rewardsPointsBalance', [formattedPoints])
            : formattedPoints}
        </Text>
      </Box>
      {allowHideBadge && isHovered && (
        <Box
          className="cursor-pointer flex items-center hover:text-text-alternative"
          onClick={handleClose}
        >
          <Icon
            name={IconName.Close}
            size={IconSize.Sm}
            aria-label={t('close')}
          />
        </Box>
      )}
    </Box>
  );
};
