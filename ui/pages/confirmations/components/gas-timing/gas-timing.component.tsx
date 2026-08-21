import React, { useContext, useMemo } from 'react';
import classNames from 'clsx';
import { useSelector } from 'react-redux';
import {
  GasEstimateTypes,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import { Box, Text } from '../../../../components/component-library';
import { I18nContext } from '../../../../contexts/i18n';
import {
  getGasEstimateType,
  getGasEstimateTypeByChainId,
  getGasFeeEstimates,
  getGasFeeEstimatesByChainId,
  getIsGasEstimatesLoading,
  getIsGasEstimatesLoadingByChainId,
} from '../../../../ducks/metamask/metamask';
import {
  Display,
  FlexWrap,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { GAS_FORM_ERRORS as gasFormErrors } from '../../../../helpers/constants/gas';
import { useGasFeeTimeEstimate } from '../../hooks/gas/useGasFeeTimeEstimate';

// Once we reach this second threshold, we switch to minutes as a unit
const secondCutoff = 90;

// Shows "seconds" as unit of time if under secondCutoff, otherwise "minutes"
const toHumanReadableTime = (
  milliseconds = 1,
  t: (key: string, args?: unknown[]) => string,
) => {
  const seconds = Math.ceil(milliseconds / 1000);
  if (seconds <= secondCutoff) {
    return t('gasTimingSecondsShort', [seconds]);
  }
  return t('gasTimingMinutesShort', [Math.ceil(seconds / 60)]);
};

// Preset levels show their label; others (e.g. tenPercentIncreased, custom) show as "Advanced"
const presetEstimates = new Set(['low', 'medium', 'high']);

type GasTimingProps = {
  chainId?: string;
  networkClientId?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasWarnings?: {
    maxPriorityFee?: string;
    maxFee?: string;
  };
  userFeeLevelOverride?: string;
};

export default function GasTiming({
  chainId,
  networkClientId,
  maxFeePerGas = '0',
  maxPriorityFeePerGas = '0',
  gasWarnings,
  userFeeLevelOverride,
}: GasTimingProps) {
  const chainGasEstimateType = useSelector((state) =>
    getGasEstimateTypeByChainId(state, chainId),
  );
  const rootGasEstimateType = useSelector(getGasEstimateType);
  const gasEstimateType = chainGasEstimateType ?? rootGasEstimateType;

  const chainGasFeeEstimates = useSelector((state) =>
    getGasFeeEstimatesByChainId(state, chainId),
  );
  const gasFeeEstimatesFromRoot = useSelector(getGasFeeEstimates);

  const chainIsGasEstimatesLoading = useSelector((state) =>
    chainId
      ? getIsGasEstimatesLoadingByChainId(state, { chainId, networkClientId })
      : undefined,
  );
  const rootIsGasEstimatesLoading = useSelector(getIsGasEstimatesLoading);
  const isGasEstimatesLoading =
    chainIsGasEstimatesLoading ?? rootIsGasEstimatesLoading;

  const gasFeeEstimates = chainGasFeeEstimates || gasFeeEstimatesFromRoot;
  const t = useContext(I18nContext);

  // If the user has chosen a value lower than the low gas fee estimate,
  // we'll need to fetch a custom time estimate via useGasFeeTimeEstimate
  const isUnknownLow = Boolean(
    gasFeeEstimates?.low &&
      Number(maxPriorityFeePerGas) <
        Number(gasFeeEstimates.low.suggestedMaxPriorityFeePerGas),
  );

  const { data: customEstimatedTime } = useGasFeeTimeEstimate({
    maxPriorityFeePerGas,
    maxFeePerGas,
    enabled: isUnknownLow,
  });

  const estimateTextMap = useMemo(
    () => ({
      [PriorityLevels.tenPercentIncreased]: t('tenPercentIncreased'),
      [PriorityLevels.dAppSuggested]: t('dappSuggested'),
      [PriorityLevels.dappSuggestedHigh]: t('dappSuggested'),
    }),
    [t],
  );

  if (
    gasWarnings?.maxPriorityFee === gasFormErrors.MAX_PRIORITY_FEE_TOO_LOW ||
    gasWarnings?.maxFee === gasFormErrors.MAX_FEE_TOO_LOW
  ) {
    return (
      <Text
        variant={TextVariant.bodySm}
        fontWeight={FontWeight.Bold}
        color={TextColor.textAlternative}
        className={classNames('gas-timing', 'gas-timing--negative')}
      >
        {t('editGasTooLow')}
      </Text>
    );
  }

  // Don't show anything if we don't have enough information
  if (
    isGasEstimatesLoading ||
    gasEstimateType !== GasEstimateTypes.feeMarket
  ) {
    return null;
  }

  const { low = {}, medium = {}, high = {} } = gasFeeEstimates ?? {};

  const estimateToUse = userFeeLevelOverride ?? 'medium';

  const isPresetEstimate = presetEstimates.has(estimateToUse);
  const textTKey = estimateToUse === 'low' ? 'gasTimingLow' : estimateToUse;
  let text =
    estimateTextMap[estimateToUse as keyof typeof estimateTextMap] ??
    (isPresetEstimate ? t(textTKey) : t('custom'));
  let time = '';
  let timeMs = 0;

  // Anything medium or faster is positive
  if (
    Number(maxPriorityFeePerGas) >=
    Number(medium.suggestedMaxPriorityFeePerGas)
  ) {
    // High+ is very likely, medium is likely
    if (
      Number(maxPriorityFeePerGas) < Number(high.suggestedMaxPriorityFeePerGas)
    ) {
      // Medium
      timeMs = low.maxWaitTimeEstimate;
      time = toHumanReadableTime(timeMs, t);
    } else {
      // High
      timeMs = high.minWaitTimeEstimate;
      time = toHumanReadableTime(timeMs, t);
    }
  } else if (isUnknownLow) {
    // If the user has chosen a value less than our low estimate,
    // calculate a potential wait time
    const upperTimeBound =
      customEstimatedTime &&
      typeof customEstimatedTime === 'object' &&
      'upperTimeBound' in customEstimatedTime
        ? customEstimatedTime.upperTimeBound
        : undefined;

    // If we didn't get any useful information, show the
    // "unknown processing time" message
    if (
      !customEstimatedTime ||
      (customEstimatedTime as unknown) === 'unknown' ||
      upperTimeBound === 'unknown'
    ) {
      text = t('editGasTooLow');
    } else {
      timeMs = Number(upperTimeBound);
      time = toHumanReadableTime(timeMs, t);
    }
  } else {
    timeMs = low.maxWaitTimeEstimate;
    time = toHumanReadableTime(timeMs, t);
  }

  return (
    <Box display={Display.Flex} marginBottom={1} flexWrap={FlexWrap.Wrap}>
      {text && (
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
          paddingInlineEnd={2}
        >
          {text}
        </Text>
      )}

      {time && (
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          <span data-testid="gas-timing-time">
            {timeMs > 0 && timeMs < 1000 ? `<${time}` : `~${time}`}
          </span>
        </Text>
      )}
    </Box>
  );
}
