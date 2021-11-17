import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import FormField from '../../ui/form-field';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import { useGasFeeContext } from '../../../contexts/gasFee';
import {
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../../helpers/utils/conversions.util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Typography from '../../ui/typography';
import {
  divideCurrencies,
  multiplyCurrencies,
} from '../../../../shared/modules/conversion.utils';
import { SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';

const AdvancedGasPopover = ({ onClose }) => {
  const t = useI18nContext();
  const {
    maxPriorityFeePerGas,
    maxFeePerGas,
    estimatedBaseFee,
    onManualChange,
  } = useGasFeeContext();

  const [editingInGwei, setEditingInGwei] = useState(false);
  const [priorityFee, setPriorityFee] = useState(maxPriorityFeePerGas);

  const estimatedBaseFeeInDecGWEI = hexWEIToDecGWEI(estimatedBaseFee, {
    numberOfDecimals: 6,
  });
  const baseFeeMultiplier = divideCurrencies(
    decGWEIToHexWEI(maxFeePerGas),
    estimatedBaseFee,
    {
      numberOfDecimals: 6,
      dividendBase: 16,
      divisorBase: 16,
      toNumericBase: 'dec',
    },
  );
  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(
    baseFeeMultiplier,
  );

  const baseFee = multiplyCurrencies(estimatedBaseFee, maxBaseFeeMultiplier, {
    numberOfDecimals: 6,
    multiplicandBase: 16,
    multiplierBase: 10,
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });
  const [maxBaseFeeGWEI, setMaxBaseFeeGWEI] = useState(baseFee);
  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);
  const [, { value: baseFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(baseFee),
    { currency, numberOfDecimals },
  );
  const [, { value: priorityFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(priorityFee),
    { currency, numberOfDecimals },
  );
  const baseFeeFiatMessage =
    parseFloat(baseFeeInFiat.split('$')[1]) >= 0.01
      ? t('fiatApproxValueShown', [baseFeeInFiat])
      : t('fiatValueLowerThanDecimalsShown');
  const priorityFeeFiatMessage =
    parseFloat(priorityFeeInFiat.split('$')[1]) >= 0.01
      ? t('fiatApproxValueShown', [priorityFeeInFiat])
      : t('fiatValueLowerThanDecimalsShown');

  const setBaseFee = useCallback(
    (value) => {
      let baseFeeValue = value;
      if (editingInGwei) {
        baseFeeValue = divideCurrencies(
          decGWEIToHexWEI(value),
          estimatedBaseFee,
          {
            numberOfDecimals: 6,
            dividendBase: 16,
            divisorBase: 16,
            toNumericBase: 'dec',
          },
        );
        setMaxBaseFeeGWEI(value);
        setMaxBaseFeeMultiplier(baseFeeValue);
      } else {
        baseFeeValue = multiplyCurrencies(estimatedBaseFee, value, {
          numberOfDecimals: 6,
          multiplicandBase: 16,
          multiplierBase: 10,
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'GWEI',
        });
        setMaxBaseFeeMultiplier(value);
        setMaxBaseFeeGWEI(baseFeeValue);
      }
    },
    [
      estimatedBaseFee,
      editingInGwei,
      setMaxBaseFeeGWEI,
      setMaxBaseFeeMultiplier,
    ],
  );

  const updateBaseFeeMode = useCallback(
    (value) => {
      if (value) {
        const baseFeeGwei = multiplyCurrencies(
          estimatedBaseFee,
          maxBaseFeeMultiplier,
          {
            numberOfDecimals: 6,
            multiplicandBase: 16,
            multiplierBase: 10,
            toNumericBase: 'dec',
            fromDenomination: 'WEI',
            toDenomination: 'GWEI',
          },
        );
        setMaxBaseFeeGWEI(baseFeeGwei);
      } else {
        const baseFeeMul = divideCurrencies(
          decGWEIToHexWEI(maxBaseFeeGWEI),
          estimatedBaseFee,
          {
            numberOfDecimals: 6,
            dividendBase: 16,
            divisorBase: 16,
            toNumericBase: 'dec',
          },
        );
        setMaxBaseFeeMultiplier(baseFeeMul);
      }
      setEditingInGwei(value);
    },
    [
      estimatedBaseFee,
      maxBaseFeeMultiplier,
      maxBaseFeeGWEI,
      setMaxBaseFeeGWEI,
      setMaxBaseFeeMultiplier,
      setEditingInGwei,
    ],
  );

  return (
    <Popover
      className="advanced-gas-popover"
      title="Advanced gas fee"
      onBack={() => onClose()}
      onClose={() => onClose()}
    >
      <Box className="advanced-gas-popover" margin={4}>
        <FormField
          onChange={(value) => {
            onManualChange?.();
            setBaseFee(value);
          }}
          titleFontSize={TYPOGRAPHY.H7}
          titleText={t('maxBaseFee')}
          titleUnit={
            editingInGwei ? t('gweiInParanthesis') : t('multiplierInParathesis')
          }
          tooltipText={t('advancedBaseGasFeeToolTip')}
          titleDetail={
            editingInGwei ? (
              <Button
                className="advanced-gas-popover__edit-link"
                type="link"
                onClick={() => updateBaseFeeMode(false)}
              >
                {t('editInMultiplier')}
              </Button>
            ) : (
              <Button
                className="advanced-gas-popover__edit-link"
                type="link"
                onClick={() => updateBaseFeeMode(true)}
              >
                {t('editInGwei')}
              </Button>
            )
          }
          value={editingInGwei ? maxBaseFeeGWEI : maxBaseFeeMultiplier}
          detailText={
            editingInGwei
              ? t('baseFeeFiatFromMultiplier', [
                  maxBaseFeeMultiplier,
                  baseFeeFiatMessage,
                ])
              : t('baseFeeFiatFromGwei', [baseFee, baseFeeFiatMessage])
          }
          numeric
          bottomBorder
          inputDetails={
            <Box className="advanced-gas-popover__input-subtext">
              <Box className="advanced-gas-popover__input-subtext">
                <Typography
                  tag={TYPOGRAPHY.H8}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  Current:
                </Typography>
                <Typography
                  tag={TYPOGRAPHY.Paragraph}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                >
                  {`${estimatedBaseFeeInDecGWEI} GWEI`}
                </Typography>
                <img height="18" src="./images/high-arrow.svg" alt="" />
              </Box>
              <Box
                marginLeft={4}
                className="advanced-gas-popover__input-subtext"
              >
                <Typography
                  tag={TYPOGRAPHY.H8}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  12hr:
                </Typography>
                <Typography
                  tag={TYPOGRAPHY.H8}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                >
                  23-359 GWEI
                </Typography>
              </Box>
            </Box>
          }
        />
        <FormField
          onChange={(value) => {
            onManualChange?.();
            setPriorityFee(value);
          }}
          titleFontSize={TYPOGRAPHY.H7}
          titleText={t('priorityFee')}
          titleUnit={t('gweiInParanthesis')}
          tooltipText={t('advancedPriorityFeeToolTip')}
          value={priorityFee}
          detailText={priorityFeeFiatMessage}
          numeric
          bottomBorder
          inputDetails={
            <Box className="advanced-gas-popover__input-subtext">
              <Box className="advanced-gas-popover__input-subtext">
                <Typography
                  tag={TYPOGRAPHY.H8}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  Current:
                </Typography>
                <Typography
                  tag={TYPOGRAPHY.Paragraph}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                >
                  1-18 GWEI
                </Typography>
                <img height="18" src="./images/low-arrow.svg" alt="" />
              </Box>
              <Box
                marginLeft={4}
                className="advanced-gas-popover__input-subtext"
              >
                <Typography
                  tag={TYPOGRAPHY.H8}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  12hr:
                </Typography>
                <Typography
                  tag={TYPOGRAPHY.H8}
                  variant={TYPOGRAPHY.H8}
                  color={COLORS.UI4}
                >
                  0.1-127 GWEI
                </Typography>
              </Box>
            </Box>
          }
        />
      </Box>
    </Popover>
  );
};

AdvancedGasPopover.propTypes = {
  onClose: PropTypes.func,
};

export default AdvancedGasPopover;
