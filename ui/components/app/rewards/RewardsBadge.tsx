import React, { useState } from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const RewardsBadge = ({
  formattedPoints,
  boxClassName,
  textClassName,
  withPointsSuffix = true,
}: {
  formattedPoints: string;
  boxClassName?: string;
  textClassName?: string;
  withPointsSuffix?: boolean;
}) => {
  const t = useI18nContext();
  const [imageLoadError, setImageLoadError] = useState(false);

  return (
    <Box
      className={`flex items-center${boxClassName ? ` ${boxClassName}` : ''}`}
      data-testid="rewards-points-balance"
    >
      {!imageLoadError && (
        <img
          src="./images/metamask-rewards-points.svg"
          alt={t('rewardsPointsIcon')}
          width={16}
          height={16}
          onError={() => setImageLoadError(true)}
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
  );
};
