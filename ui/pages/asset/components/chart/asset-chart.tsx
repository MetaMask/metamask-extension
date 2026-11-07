import React, { useEffect, useRef, useState } from 'react';
import classnames from 'clsx';
import { Hex, isCaipAssetType } from '@metamask/utils';
import { trim } from 'lodash';
import { Duration } from 'luxon';
import { useParams } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  ButtonBaseSize,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { processAssetParams } from '../../util';
import { AssetChartBody } from './asset-chart-body';
import AssetChartPrice from './asset-chart-price';

/**
 * Returns a translated time range label for a given ISO 8601 duration string.
 * The passed duration is normalized and rescaled to get the cleanest, most human-friendly representation.
 *
 * Any passed duration string that is greater than 100 years will be translated to "All".
 *
 * [Normalized](https://moment.github.io/luxon/api-docs/index.html#durationnormalize).
 * It's reduced to its canonical representation in its current units, for instance:
 * - "P2YT5000D" (2 years and 5000 days) becomes "P15YT255D" (15 years and 255 days)
 * - "PT12H-45M" (12 hours and -45 minutes) becomes "P1DT11H15M" (11 hours and 15 minutes)
 *
 * [Rescaled](https://moment.github.io/luxon/api-docs/index.html#durationrescale)
 * Converts to the largest possible unit, for instance:
 * - "PT9000S" (9000 seconds) becomes "P2H30M" (2 hours and 30 minutes)
 *
 * @param translator - A function that translates a key to a string.
 * @param iso8601Duration - The ISO 8601 duration string, e.g. "P1D", "P1M", "P1Y", "P3YT45S", ...
 * @returns The translated time range label, e.g. if locale is 'en': "1D", "1M", "1Y", "3Y 45S", ...
 */
const getTranslatedTimeRangeLabel = (
  translator: (key: string) => string,
  iso8601Duration: string,
) => {
  const { years, months, weeks, days, hours, minutes, seconds, milliseconds } =
    Duration.fromISO(iso8601Duration, { locale: 'en' })
      .normalize()
      .rescale()
      .toObject();

  if (years && years > 100) {
    return `${translator('all')}`;
  }

  return trim(
    `${years ? `${years}${translator('durationSuffixYear')} ` : ''}${
      months ? `${months}${translator('durationSuffixMonth')} ` : ''
    }${weeks ? `${weeks}${translator('durationSuffixWeek')} ` : ''}${
      days ? `${days}${translator('durationSuffixDay')} ` : ''
    }${hours ? `${hours}${translator('durationSuffixHour')} ` : ''}${
      minutes ? `${minutes}${translator('durationSuffixMinute')} ` : ''
    }${seconds ? `${seconds}${translator('durationSuffixSecond')} ` : ''}${
      milliseconds
        ? `${milliseconds}${translator('durationSuffixMillisecond')}`
        : ''
    }`,
  );
};

const TIME_RANGES = ['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y'];

// Non-EVM routes carry the CAIP-19 id. `address` can be the selected
// account's native asset on a different chain.
const getChartAddress = (
  chainId: Hex,
  decodedAsset: string | undefined,
  address: string,
): string => {
  if (!isEvmChainId(chainId) && decodedAsset && isCaipAssetType(decodedAsset)) {
    return decodedAsset;
  }
  return address;
};

// A chart showing historic prices for a native or token asset
const AssetChart = ({
  chainId,
  address,
  currentPrice,
  currency,
}: {
  chainId: Hex;
  address: string;
  currentPrice?: number;
  currency: string;
}) => {
  const t = useI18nContext();
  const { decodedAsset } = processAssetParams(useParams());
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(
    TIME_RANGES[0],
  );

  const {
    loading,
    isFetching,
    isPlaceholderData,
    data: { prices, metadata },
  } = useHistoricalPrices({
    chainId,
    address: getChartAddress(chainId, decodedAsset, address),
    currency,
    timeRange: selectedTimeRange,
  });

  // When the chart is not loading anymore and there are no prices, there is
  // nothing to compare the current price against.
  const shouldShowChartEmptyState = !loading && prices.length === 0;

  const priceRef = useRef<{
    setPrice: (_: { price?: number; date?: number }) => void;
  }>();

  // Init the price ref with the current price
  useEffect(() => {
    priceRef?.current?.setPrice({
      price: currentPrice,
      date: Date.now(),
    });
  }, [currentPrice]);

  return (
    <Box className="flex rounded-lg" flexDirection={BoxFlexDirection.Column}>
      <AssetChartPrice
        ref={priceRef}
        loading={loading || isPlaceholderData}
        currency={currency}
        price={currentPrice}
        date={Date.now()}
        comparePrice={
          isPlaceholderData || shouldShowChartEmptyState
            ? undefined
            : prices?.[0]?.y
        }
      />

      <AssetChartBody
        prices={prices}
        metadata={metadata}
        loading={loading}
        isFetching={isFetching}
        isPlaceholderData={isPlaceholderData}
        currency={currency}
        currentPrice={currentPrice}
        onHoverPrice={(point) => priceRef?.current?.setPrice(point)}
      >
        <Box
          style={prices ? undefined : { visibility: `hidden` }}
          className="flex"
          justifyContent={BoxJustifyContent.Between}
          marginTop={2}
          marginLeft={3}
          marginRight={3}
        >
          {TIME_RANGES.map((timeRange) => (
            <ButtonBase
              key={timeRange}
              className={classnames(
                'h-6 px-2 bg-transparent text-alternative hover:bg-default-pressed',
                {
                  'bg-default-hover text-default':
                    timeRange === selectedTimeRange,
                },
              )}
              onClick={() => setSelectedTimeRange(timeRange)}
              size={ButtonBaseSize.Sm}
              textProps={{ variant: TextVariant.BodyXs }}
            >
              {getTranslatedTimeRangeLabel(
                t as (key: string) => string,
                timeRange,
              )}
            </ButtonBase>
          ))}
        </Box>
      </AssetChartBody>
    </Box>
  );
};

export default AssetChart;
