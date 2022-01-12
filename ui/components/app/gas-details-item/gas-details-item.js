import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { COLORS } from '../../../helpers/constants/design-system';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';
import { getPreferences } from '../../../selectors';
import { useGasFeeContext } from '../../../contexts/gasFee';

import Box from '../../ui/box';
import I18nValue from '../../ui/i18n-value';
import LoadingHeartBeat from '../../ui/loading-heartbeat';
import GasTiming from '../gas-timing/gas-timing.component';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import GasDetailsItemTitle from './gas-details-item-title';

const GasDetailsItem = ({ userAcknowledgedGasMissing = false }) => {
  const {
    estimateUsed,
    hasSimulationError,
    maximumCostInHexWei: hexMaximumTransactionFee,
    minimumCostInHexWei: hexMinimumTransactionFee,
    transaction,
  } = useGasFeeContext();

  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);

  if (hasSimulationError && !userAcknowledgedGasMissing) {
    return null;
  }

  return (
    <TransactionDetailItem
      key="gas-item"
      detailTitle={<GasDetailsItemTitle />}
      detailTitleColor={COLORS.BLACK}
      detailText={
        <div className="gas-details-item__currency-container">
          <LoadingHeartBeat />
          <UserPreferencedCurrencyDisplay
            type={SECONDARY}
            value={hexMinimumTransactionFee}
            hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
          />
        </div>
      }
      detailTotal={
        <div className="gas-details-item__currency-container">
          <LoadingHeartBeat />
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            value={hexMinimumTransactionFee}
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
              'gas-details-item__gas-fee-warning': estimateUsed === 'high',
            })}
          >
            <LoadingHeartBeat />
            <Box marginRight={1}>
              <strong>
                {estimateUsed === 'high' && '⚠ '}
                <I18nValue messageKey="editGasSubTextFeeLabel" />
              </strong>
            </Box>
            <div
              key="editGasSubTextFeeValue"
              className="gas-details-item__currency-container"
            >
              <LoadingHeartBeat />
              <UserPreferencedCurrencyDisplay
                key="editGasSubTextFeeAmount"
                type={PRIMARY}
                value={hexMaximumTransactionFee}
                hideLabel={!useNativeCurrencyAsPrimaryCurrency}
              />
            </div>
          </Box>
        </>
      }
      subTitle={
        <GasTiming
          maxPriorityFeePerGas={hexWEIToDecGWEI(
            transaction.txParams.maxPriorityFeePerGas,
          )}
          maxFeePerGas={hexWEIToDecGWEI(transaction.txParams.maxFeePerGas)}
        />
      }
    />
  );
};

GasDetailsItem.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
};

export default GasDetailsItem;
