import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useSelector } from 'react-redux';
import { Text } from '../../../../components/component-library';
import { TextColor } from '../../../../helpers/constants/design-system';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { PriorityLevels } from '../../../../../shared/constants/gas';
import {
  getIsMultiLayerFeeNetwork,
  getPreferences,
  getTxData,
  getUseCurrencyRateCheck,
  transactionFeeSelector,
} from '../../../../selectors';
import { getCurrentDraftTransaction } from '../../../../ducks/send';
import {
  hexWEIToDecGWEI,
  sumHexes,
} from '../../../../../shared/modules/conversion.utils';
import { useDraftTransactionWithTxParams } from '../../hooks/useDraftTransactionWithTxParams';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Box from '../../../../components/ui/box';
import LoadingHeartBeat from '../../../../components/ui/loading-heartbeat';
import EditGasFeeIcon from '../edit-gas-fee-icon/edit-gas-fee-icon';
import GasTiming from '../gas-timing/gas-timing.component';
import fetchEstimatedL1Fee from '../../../../helpers/utils/optimism/fetchEstimatedL1Fee';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';

const GasDetailsItem = ({
  'data-testid': dataTestId,
  userAcknowledgedGasMissing = false,
}) => {
  const t = useI18nContext();

  const isMultiLayerFeeNetwork = useSelector(getIsMultiLayerFeeNetwork);
  const txData = useSelector(getTxData);

  const [estimatedL1Fees, setEstimatedL1Fees] = useState(null);

  useEffect(() => {
    if (isMultiLayerFeeNetwork) {
      fetchEstimatedL1Fee(txData?.chainId, txData)
        .then((result) => {
          setEstimatedL1Fees(result);
        })
        .catch((_err) => {
          setEstimatedL1Fees(null);
        });
    }
  }, [isMultiLayerFeeNetwork, txData]);

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
  const getTransactionFeeTotal = useMemo(() => {
    if (isMultiLayerFeeNetwork) {
      return sumHexes(hexMinimumTransactionFee, estimatedL1Fees || 0);
    }

    return hexMinimumTransactionFee;
  }, [isMultiLayerFeeNetwork, hexMinimumTransactionFee, estimatedL1Fees]);

  const getMaxTransactionFeeTotal = useMemo(() => {
    if (isMultiLayerFeeNetwork) {
      return sumHexes(hexMaximumTransactionFee, estimatedL1Fees || 0);
    }

    return hexMaximumTransactionFee;
  }, [isMultiLayerFeeNetwork, hexMaximumTransactionFee, estimatedL1Fees]);

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
      detailTitle={<Text>{t('estimatedFee')}</Text>}
      detailTitleColor={TextColor.textDefault}
      detailText={
        Object.keys(draftTransaction).length === 0 && (
          <div className="gas-details-item__currency-container">
            <LoadingHeartBeat estimateUsed={estimateUsed} />
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
          <LoadingHeartBeat estimateUsed={estimateUsed} />
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            value={getTransactionFeeTotal || draftHexMinimumTransactionFee}
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
                  getMaxTransactionFeeTotal || draftHexMaximumTransactionFee
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
