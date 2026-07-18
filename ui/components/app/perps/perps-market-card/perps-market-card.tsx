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
import { useSelector } from 'react-redux';
import { getIsPerpsShowFullAssetNamesEnabled } from '../../../../selectors/perps/feature-flags';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  formatSignedChangePercent,
  getChangeColor,
  getDisplayName,
} from '../utils';

const CARD_STYLES =
  'justify-start rounded-none min-w-0 h-[62px] gap-4 text-left cursor-pointer bg-default pt-2 pb-2 px-4 hover:bg-hover active:bg-pressed [container-name:list-item] [container-type:inline-size]';

export type PerpsMarketCardProps = {
  symbol: string;
  /** Full asset name (e.g. 'Bitcoin'); falls back to the ticker when omitted */
  name?: string;
  price: string;
  change24hPercent: string;
  volume?: string;
  maxLeverage?: string;
  onClick: (symbol: string) => void;
  'data-testid'?: string;
};

export const PerpsMarketCard = ({
  symbol,
  name,
  price,
  change24hPercent,
  volume,
  maxLeverage,
  onClick,
  'data-testid': testId,
}: PerpsMarketCardProps) => {
  const showFullAssetNames = useSelector(getIsPerpsShowFullAssetNamesEnabled);
  const displaySymbol = getDisplayName(
    showFullAssetNames ? name || symbol : symbol,
  );
  const displayChange24hPercent = formatSignedChangePercent(change24hPercent);
  const changeColor = getChangeColor(displayChange24hPercent);

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
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text
            fontWeight={FontWeight.Medium}
            className="text-s-body-md @compact:text-s-body-sm"
          >
            {displaySymbol}
          </Text>
          {maxLeverage && (
            <span className="shrink-0 rounded-md bg-background-muted px-1.5">
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                {maxLeverage}
              </Text>
            </span>
          )}
        </Box>
        {volume ? (
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {volume}
          </Text>
        ) : null}
      </Box>
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text
          fontWeight={FontWeight.Medium}
          className="text-s-body-md @compact:text-s-body-sm"
        >
          {price}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={changeColor}
          data-testid="perps-market-card-change"
        >
          {displayChange24hPercent}
        </Text>
      </Box>
    </ButtonBase>
  );
};
