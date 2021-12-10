import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { COLORS } from '../../../helpers/constants/design-system';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';

import Box from '../../../components/ui/box';
import GasTiming from '../../../components/app/gas-timing/gas-timing.component';
import I18nValue from '../../../components/ui/i18n-value';
import LoadingHeartBeat from '../../../components/ui/loading-heartbeat';
import TransactionDetailItem from '../../../components/app/transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
import { useGasFeeContext } from '../../../contexts/gasFee';
import GasDetailsItemTitle from './gas-details-item-title';

const GasDetailsItem = ({
  hexMaximumTransactionFee,
  hexMinimumTransactionFee,
  maxFeePerGas,
  maxPriorityFeePerGas,
  userAcknowledgedGasMissing,
  useNativeCurrencyAsPrimaryCurrency,
}) => {
  const { estimateUsed, hasSimulationError, transaction } = useGasFeeContext();

  if (hasSimulationError && !userAcknowledgedGasMissing) return null;

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
            maxPriorityFeePerGas || transaction.txParams.maxPriorityFeePerGas,
          )}
          maxFeePerGas={hexWEIToDecGWEI(
            maxFeePerGas || transaction.txParams.maxFeePerGas,
          )}
        />
      }
    />
  );
};

GasDetailsItem.propTypes = {
  hexMaximumTransactionFee: PropTypes.string,
  hexMinimumTransactionFee: PropTypes.string,
  maxFeePerGas: PropTypes.string,
  maxPriorityFeePerGas: PropTypes.string,
  userAcknowledgedGasMissing: PropTypes.bool.isRequired,
  useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
};

export default GasDetailsItem;
