import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { Icon, IconName, IconSize } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setRewardsBadgeHidden } from '../../../ducks/rewards';
import { setStorageItem } from '../../../../shared/lib/storage-helpers';
import { REWARDS_BADGE_HIDDEN } from './utils/constants';

export const RewardsBadge = ({
  formattedPoints,
  boxClassName,
  textClassName,
  withPointsSuffix = true,
  useAlternativeIconColor = false,
  allowHideBadge = false,
  onClick,
}: {
  formattedPoints: string;
  boxClassName?: string;
  textClassName?: string;
  withPointsSuffix?: boolean;
  useAlternativeIconColor?: boolean;
  allowHideBadge?: boolean;
  onClick?: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [imageLoadError, setImageLoadError] = useState(false);
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
        {!imageLoadError && (
          <img
            src="./images/metamask-rewards-points.svg"
            alt={t('rewardsPointsIcon')}
            width={16}
            height={16}
            onError={() => setImageLoadError(true)}
            style={
              useAlternativeIconColor
                ? {
                    filter: 'grayscale(100%)',
                  }
                : undefined
            }
          />
        )}
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
