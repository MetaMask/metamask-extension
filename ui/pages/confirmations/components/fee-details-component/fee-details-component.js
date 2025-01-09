import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonVariant,
  IconName,
  Text,
} from '../../../../components/component-library';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import { getShouldShowFiat } from '../../../../selectors';
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
  const shouldShowFiat = useSelector(getShouldShowFiat);

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
          {shouldShowFiat && (
            <UserPreferencedCurrencyDisplay
              type={SECONDARY}
              key="total-detail-text"
              value={value}
              suffixProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodySmBold,
              }}
              textProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodySmBold,
              }}
              hideLabel
            />
          )}
        </div>
      );
    },
    [txData],
  );

  const renderTotalDetailValue = useCallback(
    (value) => {
      return (
        <Box className="confirm-page-container-content__total-value">
          <LoadingHeartBeat estimateUsed={txData?.userFeeLevel} />
          {shouldShowFiat && (
            <UserPreferencedCurrencyDisplay
              type={PRIMARY}
              key="total-detail-value"
              value={value}
              suffixProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodySm,
              }}
              textProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodySm,
              }}
            />
          )}
        </Box>
      );
    },
    [txData],
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
            paddingTop={4}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <Button
              style={{ textDecoration: 'none' }}
              size={Size.Xs}
              variant={ButtonVariant.Link}
              endIconName={
                expandFeeDetails ? IconName.ArrowUp : IconName.ArrowDown
              }
              color={IconColor.iconAlternative}
              data-testid="expand-fee-details-button"
              onClick={() => setExpandFeeDetails(!expandFeeDetails)}
            >
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textAlternative}
                paddingInlineEnd={1}
              >
                {t('feeDetails')}
              </Text>
            </Button>
          </Box>
        )}
      </Box>

      {!hideGasDetails && expandFeeDetails && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingTop={4}
        >
          {hasLayer1GasFee && (
            <TransactionDetailItem
              detailTitle={
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySmMedium}
                >
                  {t('layer2Fees')}
                </Text>
              }
              detailText={
                useCurrencyRateCheck &&
                renderTotalDetailText(hexMinimumTransactionFee)
              }
              detailTotal={renderTotalDetailValue(hexMinimumTransactionFee)}
            />
          )}
          {layer1GasFee && (
            <TransactionDetailItem
              detailTitle={
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySmMedium}
                >
                  {t('layer1Fees')}
                </Text>
              }
              detailText={shouldShowFiat && renderTotalDetailText(layer1GasFee)}
              detailTotal={renderTotalDetailValue(layer1GasFee)}
            />
          )}
          {!hasLayer1GasFee && (
            <TransactionDetailItem
              detailTitle={t('total')}
              detailText={
                shouldShowFiat && renderTotalDetailText(getTransactionFeeTotal)
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
