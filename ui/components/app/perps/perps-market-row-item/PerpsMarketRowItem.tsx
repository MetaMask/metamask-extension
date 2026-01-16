import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { getPerpsMarketRowItemSelector } from '../../Perps.testIds';
import { strings } from '../../../../../../locales/i18n';
import Text, {
  TextColor,
  TextVariant,
} from '../../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../../component-library/hooks';
import {
  PERPS_CONSTANTS,
  HOME_SCREEN_CONFIG,
} from '../../constants/perpsConfig';
import type { PerpsMarketData } from '../../controllers/types';
import { usePerpsLivePrices } from '../../hooks/stream';
import {
  getPerpsDisplaySymbol,
  getMarketBadgeType,
} from '../../utils/marketUtils';
import {
  formatFundingRate,
  formatPercentage,
  formatPerpsFiat,
  formatPnl,
  formatVolume,
  PRICE_RANGES_UNIVERSAL,
} from '../../utils/formatUtils';
import PerpsBadge from '../PerpsBadge';
import PerpsLeverage from '../PerpsLeverage/PerpsLeverage';
import PerpsTokenLogo from '../PerpsTokenLogo';
import styleSheet from './PerpsMarketRowItem.styles';
import { PerpsMarketRowItemProps } from './PerpsMarketRowItem.types';

const PerpsMarketRowItem = ({
  market,
  onPress,
  iconSize = HOME_SCREEN_CONFIG.DEFAULT_ICON_SIZE,
  displayMetric = 'volume',
  showBadge = true,
}: PerpsMarketRowItemProps) => {
const getDisplayValue = (market: PerpsMarketData, displayMetric: string) => {
  switch (displayMetric) {
    case 'priceChange':
      return market.change24hPercent;
    case 'openInterest':
      return market.openInterest || '--';
    case 'fundingRate':
      return formatFundingRate(market.fundingRate);
    case 'volume':
    default:
      return market.volume;
  }
};

const getMetricLabel = (displayMetric: string) => {
  switch (displayMetric) {
    case 'priceChange':
      return ''; // % suffix is enough
    case 'openInterest':
      return 'OI';
    case 'fundingRate':
      return 'FR';
    case 'volume':
    default:
      return 'Vol';
  }
};

<div className="market-row" onClick={onClick}>
  <div className="left-section">
    <PerpsTokenLogo symbol={market.symbol} size={32} />
    <div className="token-info">
      <div className="token-header">
        <span className="symbol">{getDisplaySymbol(market.symbol)}</span>
        <span className="leverage">{market.maxLeverage}</span>
      </div>
      <div className="second-row">
        <span className="metric">{displayText}</span>
        {showBadge && badgeType && <PerpsBadge type={badgeType} />}
      </div>
    </div>
  </div>
  <div className="right-section">
    <span className="price">{market.price}</span>
    <span className={isPositive ? 'positive' : 'negative'}>
      {market.change24hPercent}
    </span>
  </div>
</div>;
