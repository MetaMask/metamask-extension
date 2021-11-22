import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import FormField from '../../ui/form-field';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import I18nValue from '../../ui/i18n-value';
import {
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../../helpers/utils/conversions.util';
import {
  divideCurrencies,
  multiplyCurrencies,
} from '../../../../shared/modules/conversion.utils';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { SECONDARY } from '../../../helpers/constants/common';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import AdvancedGasFeeInputSubtext from './advanced-gas-fee-input-subtext';

const AdvancedGasFeePopover = ({ onClose }) => {
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
      className="advanced-gas-fee-popover"
      title={t('advancedGasFeeModalTitle')}
      onBack={() => onClose()}
      onClose={() => onClose()}
    >
      <Box className="advanced-gas-fee-popover" margin={4}>
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
                className="advanced-gas-fee-popover__edit-link"
                type="link"
                onClick={() => updateBaseFeeMode(false)}
              >
                <I18nValue messageKey="editInMultiplier" />
              </Button>
            ) : (
              <Button
                className="advanced-gas-fee-popover__edit-link"
                type="link"
                onClick={() => updateBaseFeeMode(true)}
              >
                <I18nValue messageKey="editInGwei" />
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
            <AdvancedGasFeeInputSubtext
              currentData={`${estimatedBaseFeeInDecGWEI} GWEI`}
              tweleveHrData="23-359 GWEI"
            />
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
            <AdvancedGasFeeInputSubtext
              currentData="1-18 GWEI"
              tweleveHrData="0.1-127 GWEI"
            />
          }
        />
      </Box>
    </Popover>
  );
};

AdvancedGasFeePopover.propTypes = {
  onClose: PropTypes.func,
};

export default AdvancedGasFeePopover;
