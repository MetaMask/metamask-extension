import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useSelector } from 'react-redux';
import {
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import {
  IconColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { PriorityLevels } from '../../../../../shared/constants/gas';
import {
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
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import Tooltip from '../../../../components/ui/tooltip';

const GasDetailsItem = ({
  'data-testid': dataTestId,
  userAcknowledgedGasMissing = false,
}) => {
  const t = useI18nContext();

  const txData = useSelector(getTxData);
  const { layer1GasFee } = txData;

  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const transactionData = useDraftTransactionWithTxParams();
  const {
    hexMinimumTransactionFee: draftHexMinimumTransactionFee,
    hexMaximumTransactionFee: draftHexMaximumTransactionFee,
  } = useSelector((state) => transactionFeeSelector(state, transactionData));

  const {
    estimateUsed,
    hasSimulationError,
    isNetworkBusy,
    maximumCostInHexWei: hexMaximumTransactionFee,
    minimumCostInHexWei: hexMinimumTransactionFee,
    maxPriorityFeePerGas,
    maxFeePerGas,
    supportsEIP1559,
  } = useGasFeeContext();

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);

  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const getTransactionFeeTotal = useMemo(() => {
    if (layer1GasFee) {
      return sumHexes(hexMinimumTransactionFee, layer1GasFee);
    }

    return hexMinimumTransactionFee;
  }, [hexMinimumTransactionFee, layer1GasFee]);

  const getMaxTransactionFeeTotal = useMemo(() => {
    if (layer1GasFee) {
      return sumHexes(hexMaximumTransactionFee, layer1GasFee);
    }

    return hexMaximumTransactionFee;
  }, [hexMaximumTransactionFee, layer1GasFee]);

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

  const detailTitle = () => {
    if (supportsEIP1559 && isNetworkBusy) {
      return (
        <>
          <Text>{t('estimatedFee')}</Text>
          <Tooltip interactive position="top" html={t('networkIsBusy')}>
            &nbsp;&nbsp;
            <Icon
              data-testid="network-busy-tooltip"
              name={IconName.Danger}
              size={IconSize.Sm}
              color={IconColor.errorDefault}
              marginTop={2}
            />
          </Tooltip>
        </>
      );
    }
    return <Text>{t('estimatedFee')}</Text>;
  };
  return (
    <TransactionDetailItem
      key="gas-details-item"
      data-testid={dataTestId}
      detailTitle={detailTitle()}
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
