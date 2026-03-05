import React from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName } from '../utils';

const CARD_STYLES =
  'justify-start rounded-none min-w-0 h-[62px] gap-4 text-left cursor-pointer bg-default pt-2 pb-2 px-4 hover:bg-hover active:bg-pressed';

export type PerpsMarketCardProps = {
  symbol: string;
  name?: string;
  price: string;
  change24hPercent: string;
  volume?: string;
  onClick: (symbol: string) => void;
  'data-testid'?: string;
};

export const PerpsMarketCard: React.FC<PerpsMarketCardProps> = ({
  symbol,
  name,
  price,
  change24hPercent,
  volume,
  onClick,
  'data-testid': testId,
}) => {
  const displaySymbol = getDisplayName(symbol);
  const displayName = name ? getDisplayName(name) : displaySymbol;
  const isPositiveChange =
    change24hPercent.startsWith('+') || change24hPercent === '0.00%';

  return (
    <ButtonBase
      className={twMerge(CARD_STYLES)}
      isFullWidth
      onClick={() => onClick(symbol)}
      data-testid={testId}
    >
      <PerpsTokenLogo
        symbol={symbol}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Text fontWeight={FontWeight.Medium}>{displayName}</Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {displaySymbol}-USD
        </Text>
      </Box>
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {price}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={
            isPositiveChange ? TextColor.SuccessDefault : TextColor.ErrorDefault
          }
        >
          {change24hPercent}
        </Text>
        {volume && (
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            {volume}
          </Text>
        )}
      </Box>
    </ButtonBase>
  );
};
