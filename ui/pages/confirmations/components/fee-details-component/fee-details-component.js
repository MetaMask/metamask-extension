import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  Size,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  BUTTON_VARIANT,
  Box,
  Button,
  IconName,
  Text,
} from '../../../../components/component-library';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import { getPreferences } from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import LoadingHeartBeat from '../../../../components/ui/loading-heartbeat';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { addHexes } from '../../../../../shared/modules/conversion.utils';
import { useGasFeeContext } from '../../../../contexts/gasFee';

export default function FeeDetailsComponent({
  txData,
  useCurrencyRateCheck,
  hideGasDetails = false,
}) {
  const layer1GasFee = txData?.layer1GasFee ?? null;
  const [expandFeeDetails, setExpandFeeDetails] = useState(false);

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);

  const t = useI18nContext();

  const { minimumCostInHexWei: hexMinimumTransactionFee } = useGasFeeContext();

  const getTransactionFeeTotal = useMemo(() => {
    return addHexes(hexMinimumTransactionFee, layer1GasFee ?? 0);
  }, [hexMinimumTransactionFee, layer1GasFee]);

  const renderTotalDetailText = useCallback(
    (value) => {
      return (
        <div className="confirm-page-container-content__total-value">
          <LoadingHeartBeat estimateUsed={txData?.userFeeLevel} />
          <UserPreferencedCurrencyDisplay
            type={SECONDARY}
            key="total-detail-text"
            value={value}
            hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
          />
        </div>
      );
    },
    [txData, useNativeCurrencyAsPrimaryCurrency],
  );

  const renderTotalDetailValue = useCallback(
    (value) => {
      return (
        <div className="confirm-page-container-content__total-value">
          <LoadingHeartBeat estimateUsed={txData?.userFeeLevel} />
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            key="total-detail-value"
            value={value}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
          />
        </div>
      );
    },
    [txData, useNativeCurrencyAsPrimaryCurrency],
  );

  const hasLayer1GasFee = layer1GasFee !== null;

  return (
    <>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        flexDirection={FlexDirection.Column}
      >
        {!hideGasDetails && hasLayer1GasFee && (
          <Box
            padding={4}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <Button
              style={{ textDecoration: 'none' }}
              size={Size.Xs}
              variant={BUTTON_VARIANT.LINK}
              endIconName={
                expandFeeDetails ? IconName.ArrowUp : IconName.ArrowDown
              }
              color={IconColor.primaryDefault}
              data-testid="expand-fee-details-button"
              onClick={() => setExpandFeeDetails(!expandFeeDetails)}
            >
              <Text
                variant={TextVariant.bodySm}
                color={IconColor.primaryDefault}
              >
                {t('feeDetails')}
              </Text>
            </Button>
          </Box>
        )}
      </Box>

      {!hideGasDetails && expandFeeDetails && (
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          {hasLayer1GasFee && (
            <TransactionDetailItem
              detailTitle={t('layer2Fees')}
              detailText={
                useCurrencyRateCheck &&
                renderTotalDetailText(hexMinimumTransactionFee)
              }
              detailTotal={renderTotalDetailValue(hexMinimumTransactionFee)}
              boldHeadings={false}
            />
          )}
          {layer1GasFee && (
            <TransactionDetailItem
              detailTitle={t('layer1Fees')}
              detailText={
                useCurrencyRateCheck && renderTotalDetailText(layer1GasFee)
              }
              detailTotal={renderTotalDetailValue(layer1GasFee)}
              boldHeadings={false}
            />
          )}
          {!hasLayer1GasFee && (
            <TransactionDetailItem
              detailTitle={t('total')}
              detailText={
                useCurrencyRateCheck &&
                renderTotalDetailText(getTransactionFeeTotal)
              }
              detailTotal={renderTotalDetailValue(getTransactionFeeTotal)}
            />
          )}
        </Box>
      )}
    </>
  );
}

FeeDetailsComponent.propTypes = {
  txData: PropTypes.object,
  useCurrencyRateCheck: PropTypes.bool,
  hideGasDetails: PropTypes.bool,
};
