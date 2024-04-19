import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { PriorityLevels } from '../../../../../shared/constants/gas';
import {
  hexWEIToDecGWEI,
  sumHexes,
} from '../../../../../shared/modules/conversion.utils';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../../../../shared/modules/gas.utils';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { Text } from '../../../../components/component-library';
import Box from '../../../../components/ui/box';
import LoadingHeartBeat from '../../../../components/ui/loading-heartbeat';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { TextColor } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getPreferences, getUseCurrencyRateCheck } from '../../../../selectors';
import { currentConfirmationSelector } from '../../selectors';
import EditGasFeeIcon from '../edit-gas-fee-icon/edit-gas-fee-icon';
import GasTiming from '../gas-timing/gas-timing.component';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';

const GasDetailsItemRedesign = ({
  'data-testid': dataTestId,
  userAcknowledgedGasMissing = false,
}) => {
  const t = useI18nContext();

  // TODO pnf: update the transaction with new updated estimates when it happens.
  const currentConfirmation = useSelector(currentConfirmationSelector);

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);

  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  const defaultBaseFee = currentConfirmation.txParams.maxFeePerGas;
  // subtractHexes(
  //   currentConfirmation.txParams.maxFeePerGas,
  //   currentConfirmation.txParams.maxPriorityFeePerGas,
  // );

  const getTransactionFeeTotal = useMemo(() => {
    const minimumCostInHexWei = getMinimumGasTotalInHexWei({
      ...currentConfirmation.txParams,
      baseFeePerGas: defaultBaseFee,
      gasLimit: currentConfirmation.txParams.gas,
    });

    return sumHexes(minimumCostInHexWei, currentConfirmation.layer1GasFee || 0);
  }, [currentConfirmation]);

  const getMaxTransactionFeeTotal = useMemo(() => {
    const maximumCostInHexWei = getMaximumGasTotalInHexWei({
      ...currentConfirmation.txParams,
      gasLimit: currentConfirmation.txParams.gas,
    });

    return sumHexes(maximumCostInHexWei, currentConfirmation.layer1GasFee || 0);
  }, [currentConfirmation]);

  const maxPriorityFeePerGasToRender = hexWEIToDecGWEI(
    currentConfirmation.txParams?.maxPriorityFeePerGas ?? '0x0',
  ).toString();

  const maxFeePerGasToRender = hexWEIToDecGWEI(
    currentConfirmation.txParams?.maxFeePerGas ?? '0x0',
  ).toString();

  // TODO pnf: What's going to happen to simulation errors?
  // if (hasSimulationError && !userAcknowledgedGasMissing) {
  //   return null;
  // }

  return (
    <TransactionDetailItem
      key="gas-details-item"
      data-testid={dataTestId}
      detailTitle={<Text>{t('estimatedFee')}</Text>}
      detailTitleColor={TextColor.textDefault}
      detailText={
        currentConfirmation && (
          <div className="gas-details-item__currency-container">
            <LoadingHeartBeat estimateUsed={currentConfirmation.estimateUsed} />
            <EditGasFeeIcon
              userAcknowledgedGasMissing={userAcknowledgedGasMissing}
            />
            {useCurrencyRateCheck && (
              <UserPreferencedCurrencyDisplay
                type={SECONDARY}
                value={getTransactionFeeTotal}
                hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
              />
            )}
          </div>
        )
      }
      detailTotal={
        <div className="gas-details-item__currency-container">
          <LoadingHeartBeat estimateUsed={currentConfirmation.estimateUsed} />
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            value={getTransactionFeeTotal}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
          />
        </div>
      }
      subText={
        <>
          <Box
            key="editGasSubTextFeeLabel"
            display="inline-flex"
            className={classNames('gas-details-item__gasfee-label', {
              'gas-details-item__gas-fee-warning':
                currentConfirmation.estimateUsed === PriorityLevels.high ||
                currentConfirmation.estimateUsed ===
                  PriorityLevels.dappSuggestedHigh,
            })}
          >
            <LoadingHeartBeat estimateUsed={currentConfirmation.estimateUsed} />
            <Box marginRight={1}>
              <strong>
                {(currentConfirmation.estimateUsed === PriorityLevels.high ||
                  currentConfirmation.estimateUsed ===
                    PriorityLevels.dappSuggestedHigh) &&
                  '⚠ '}
                {t('editGasSubTextFeeLabel')}
              </strong>
            </Box>
            <div
              key="editGasSubTextFeeValue"
              className="gas-details-item__currency-container"
            >
              <LoadingHeartBeat
                estimateUsed={currentConfirmation.estimateUsed}
              />
              <UserPreferencedCurrencyDisplay
                key="editGasSubTextFeeAmount"
                type={PRIMARY}
                value={getMaxTransactionFeeTotal}
                hideLabel={!useNativeCurrencyAsPrimaryCurrency}
              />
            </div>
          </Box>
        </>
      }
      subTitle={
        <GasTiming
          maxPriorityFeePerGas={maxPriorityFeePerGasToRender}
          maxFeePerGas={maxFeePerGasToRender}
        />
      }
    />
  );
};

GasDetailsItemRedesign.propTypes = {
  'data-testid': PropTypes.string,
  userAcknowledgedGasMissing: PropTypes.bool,
};

export default GasDetailsItemRedesign;
