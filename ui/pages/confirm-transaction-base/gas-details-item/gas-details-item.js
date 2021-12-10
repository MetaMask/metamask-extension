import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography/typography';
import GasTiming from '../../../components/app/gas-timing/gas-timing.component';
import I18nValue from '../../../components/ui/i18n-value';
import InfoTooltip from '../../../components/ui/info-tooltip/info-tooltip';
import LoadingHeartBeat from '../../../components/ui/loading-heartbeat';
import TransactionDetailItem from '../../../components/app/transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
import { useGasFeeContext } from '../../../contexts/gasFee';

const GasDetailsItem = ({
  hexMaximumTransactionFee,
  hexMinimumTransactionFee,
  isMainnet,
  maxFeePerGas,
  maxPriorityFeePerGas,
  userAcknowledgedGasMissing,
  useNativeCurrencyAsPrimaryCurrency,
}) => {
  const t = useI18nContext();
  const { estimateUsed, hasSimulationError, transaction } = useGasFeeContext();

  if (hasSimulationError && !userAcknowledgedGasMissing) return null;

  return (
    <TransactionDetailItem
      key="gas-item"
      detailTitle={
        <Box display="flex">
          <Box marginRight={1}>
            <I18nValue messageKey="transactionDetailGasHeadingV2" />
          </Box>
          <span className="gas-details-item__estimate">
            (<I18nValue messageKey="transactionDetailGasInfoV2" />)
          </span>
          <InfoTooltip
            contentText={
              <>
                <Typography tag={TYPOGRAPHY.Paragraph} variant={TYPOGRAPHY.H7}>
                  {t('transactionDetailGasTooltipIntro', [
                    isMainnet ? t('networkNameEthereum') : '',
                  ])}
                </Typography>
                <Typography tag={TYPOGRAPHY.Paragraph} variant={TYPOGRAPHY.H7}>
                  {t('transactionDetailGasTooltipExplanation')}
                </Typography>
                <Typography tag={TYPOGRAPHY.Paragraph} variant={TYPOGRAPHY.H7}>
                  <a
                    href="https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('transactionDetailGasTooltipConversion')}
                  </a>
                </Typography>
              </>
            }
            position="bottom"
          />
        </Box>
      }
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
  isMainnet: PropTypes.bool,
  maxFeePerGas: PropTypes.string,
  maxPriorityFeePerGas: PropTypes.string,
  userAcknowledgedGasMissing: PropTypes.bool.isRequired,
  useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
};

export default GasDetailsItem;
