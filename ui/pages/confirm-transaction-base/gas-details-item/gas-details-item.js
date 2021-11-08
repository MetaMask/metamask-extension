import React from 'react';
import PropTypes from 'prop-types';

import { COLORS } from '../../../helpers/constants/design-system';
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

const HeartBeat = () =>
  process.env.IN_TEST === 'true' ? null : <LoadingHeartBeat />;

const GasDetailItem = ({
  hexMaximumTransactionFee,
  hexMinimumTransactionFee,
  isMainnet,
  maxFeePerGas,
  maxPriorityFeePerGas,
  supportsEIP1559,
  txData,
  useNativeCurrencyAsPrimaryCurrency,
}) => {
  const t = useI18nContext();
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
                <Typography fontSize="12px">
                  {t('transactionDetailGasTooltipIntro', [
                    isMainnet ? t('networkNameEthereum') : '',
                  ])}
                </Typography>
                <Typography fontSize="12px">
                  {t('transactionDetailGasTooltipExplanation')}
                </Typography>
                <Typography fontSize="12px">
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
            position="top"
          />
        </Box>
      }
      detailTitleColor={COLORS.BLACK}
      detailText={
        <div className="gas-details-item__currency-container">
          <HeartBeat />
          <UserPreferencedCurrencyDisplay
            type={SECONDARY}
            value={hexMinimumTransactionFee}
            hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
          />
        </div>
      }
      detailTotal={
        <div className="gas-details-item__currency-container">
          <HeartBeat />
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            value={hexMinimumTransactionFee}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
          />
        </div>
      }
      subText={t('editGasSubTextFee', [
        <Box key="editGasSubTextFeeLabel" display="inline-flex">
          <Box marginRight={1} className="gas-details-item__gasfee-label">
            <I18nValue messageKey="editGasSubTextFeeLabel" />
          </Box>
          <div
            key="editGasSubTextFeeValue"
            className="gas-details-item__currency-container"
          >
            <HeartBeat />
            <UserPreferencedCurrencyDisplay
              key="editGasSubTextFeeAmount"
              type={PRIMARY}
              value={hexMaximumTransactionFee}
              hideLabel={!useNativeCurrencyAsPrimaryCurrency}
            />
          </div>
        </Box>,
      ])}
      subTitle={
        supportsEIP1559 && (
          <GasTiming
            maxPriorityFeePerGas={hexWEIToDecGWEI(
              maxPriorityFeePerGas || txData.txParams.maxPriorityFeePerGas,
            )}
            maxFeePerGas={hexWEIToDecGWEI(
              maxFeePerGas || txData.txParams.maxFeePerGas,
            )}
          />
        )
      }
    />
  );
};

GasDetailItem.propTypes = {
  hexMaximumTransactionFee: PropTypes.string,
  hexMinimumTransactionFee: PropTypes.string,
  isMainnet: PropTypes.bool,
  maxFeePerGas: PropTypes.string,
  maxPriorityFeePerGas: PropTypes.string,
  supportsEIP1559: PropTypes.bool,
  txData: PropTypes.object,
  useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
};

export default GasDetailItem;
