import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { TextColor } from '../../../helpers/constants/design-system';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import {
  getPreferences,
  getUseCurrencyRateCheck,
  transactionFeeSelector,
} from '../../../selectors';
import { getCurrentDraftTransaction } from '../../../ducks/send';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Box from '../../ui/box';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import GasTiming from '../gas-timing/gas-timing.component';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { hexWEIToDecGWEI } from '../../../../shared/modules/conversion.utils';
import { useDraftTransactionWithTxParams } from '../../../hooks/useDraftTransactionWithTxParams';
import { PriorityLevels } from '../../../../shared/constants/gas';
import GasDetailsItemTitle from './gas-details-item-title';

const GasDetailsItem = ({
  'data-testid': dataTestId,
  userAcknowledgedGasMissing = false,
}) => {
  const t = useI18nContext();
  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const transactionData = useDraftTransactionWithTxParams();

  const {
    hexMinimumTransactionFee: draftHexMinimumTransactionFee,
    hexMaximumTransactionFee: draftHexMaximumTransactionFee,
  } = useSelector((state) => transactionFeeSelector(state, transactionData));

  const {
    estimateUsed,
    hasSimulationError,
    maximumCostInHexWei: hexMaximumTransactionFee,
    minimumCostInHexWei: hexMinimumTransactionFee,
    maxPriorityFeePerGas,
    maxFeePerGas,
  } = useGasFeeContext();

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);

  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  if (hasSimulationError && !userAcknowledgedGasMissing) {
    return null;
  }

  const maxPriorityFeePerGasToRender = (
    maxPriorityFeePerGas ??
    hexWEIToDecGWEI(transactionData.txParams?.maxPriorityFeePerGas ?? '0x0')
  ).toString();

  const maxFeePerGasToRender = (
    maxFeePerGas ??
    hexWEIToDecGWEI(transactionData.txParams?.maxFeePerGas ?? '0x0')
  ).toString();

  return (
    <TransactionDetailItem
      key="gas-details-item"
      data-testid={dataTestId}
      detailTitle={<GasDetailsItemTitle />}
      detailTitleColor={TextColor.textDefault}
      detailText={
        useCurrencyRateCheck &&
        Object.keys(draftTransaction).length === 0 && (
          <div className="gas-details-item__currency-container">
            <LoadingHeartBeat estimateUsed={estimateUsed} />
            <UserPreferencedCurrencyDisplay
              type={SECONDARY}
              value={hexMinimumTransactionFee}
              hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
            />
          </div>
        )
      }
      detailTotal={
        <div className="gas-details-item__currency-container">
          <LoadingHeartBeat estimateUsed={estimateUsed} />
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            value={hexMinimumTransactionFee || draftHexMinimumTransactionFee}
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
                estimateUsed === PriorityLevels.high ||
                estimateUsed === PriorityLevels.dappSuggestedHigh,
            })}
          >
            <LoadingHeartBeat estimateUsed={estimateUsed} />
            <Box marginRight={1}>
              <strong>
                {(estimateUsed === PriorityLevels.high ||
                  estimateUsed === PriorityLevels.dappSuggestedHigh) &&
                  '⚠ '}
                {t('editGasSubTextFeeLabel')}
              </strong>
            </Box>
            <div
              key="editGasSubTextFeeValue"
              className="gas-details-item__currency-container"
            >
              <LoadingHeartBeat estimateUsed={estimateUsed} />
              <UserPreferencedCurrencyDisplay
                key="editGasSubTextFeeAmount"
                type={PRIMARY}
                value={
                  hexMaximumTransactionFee || draftHexMaximumTransactionFee
                }
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

GasDetailsItem.propTypes = {
  'data-testid': PropTypes.string,
  userAcknowledgedGasMissing: PropTypes.bool,
};

export default GasDetailsItem;
