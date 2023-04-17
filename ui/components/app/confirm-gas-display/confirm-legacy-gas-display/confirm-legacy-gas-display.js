import React from 'react';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getIsMainnet,
  getPreferences,
  getUnapprovedTransactions,
  getUseCurrencyRateCheck,
  transactionFeeSelector,
  txDataSelector,
} from '../../../../selectors';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';

import TransactionDetailItem from '../../transaction-detail-item';
import UserPreferencedCurrencyDisplay from '../../user-preferenced-currency-display';
import InfoTooltip from '../../../ui/info-tooltip';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';
import { Text } from '../../../component-library/text';
import {
  FONT_STYLE,
  TextVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useDraftTransactionGasValues } from '../../../../hooks/useDraftTransactionGasValues';

const renderHeartBeatIfNotInTest = () =>
  process.env.IN_TEST ? null : <LoadingHeartBeat />;

const ConfirmLegacyGasDisplay = () => {
  const t = useI18nContext();

  // state selectors
  const isMainnet = useSelector(getIsMainnet);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const { transactionData } = useDraftTransactionGasValues();
  const txData = useSelector((state) => txDataSelector(state));
  const { id: transactionId, dappSuggestedGasFees } = txData;
  const transaction = Object.keys(transactionData).length
    ? transactionData
    : unapprovedTxs[transactionId] || {};
  const { hexMinimumTransactionFee, hexMaximumTransactionFee } = useSelector(
    (state) => transactionFeeSelector(state, transaction),
  );

  return (
    <TransactionDetailItem
      key="legacy-gas-details"
      detailTitle={
        dappSuggestedGasFees ? (
          <>
            {t('transactionDetailGasHeading')}
            <InfoTooltip
              contentText={t('transactionDetailDappGasTooltip')}
              position="top"
            >
              <i className="fa fa-info-circle" />
            </InfoTooltip>
          </>
        ) : (
          <>
            {t('transactionDetailGasHeading')}
            <InfoTooltip
              contentText={
                <>
                  <p>
                    {t('transactionDetailGasTooltipIntro', [
                      isMainnet ? t('networkNameEthereum') : '',
                    ])}
                  </p>
                  <p>{t('transactionDetailGasTooltipExplanation')}</p>
                  <p>
                    <a
                      href="https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('transactionDetailGasTooltipConversion')}
                    </a>
                  </p>
                </>
              }
              position="top"
            >
              <i className="fa fa-info-circle" />
            </InfoTooltip>
          </>
        )
      }
      detailText={
        useCurrencyRateCheck && (
          <div>
            {renderHeartBeatIfNotInTest()}
            <UserPreferencedCurrencyDisplay
              type={SECONDARY}
              value={hexMinimumTransactionFee}
              hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
            />
          </div>
        )
      }
      detailTotal={
        <div>
          {renderHeartBeatIfNotInTest()}
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            value={hexMinimumTransactionFee}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
            numberOfDecimals={6}
          />
        </div>
      }
      subText={
        <>
          <strong key="editGasSubTextFeeLabel">
            {t('editGasSubTextFeeLabel')}
          </strong>
          <div key="editGasSubTextFeeValue">
            {renderHeartBeatIfNotInTest()}
            <UserPreferencedCurrencyDisplay
              key="editGasSubTextFeeAmount"
              type={PRIMARY}
              value={hexMaximumTransactionFee}
              hideLabel={!useNativeCurrencyAsPrimaryCurrency}
            />
          </div>
        </>
      }
      subTitle={
        <>
          {dappSuggestedGasFees && (
            <Text
              variant={TextVariant.bodySm}
              fontStyle={FONT_STYLE.ITALIC}
              color={TextColor.textAlternative}
              as="h6"
            >
              {t('transactionDetailDappGasMoreInfo')}
            </Text>
          )}
        </>
      }
    />
  );
};

export default ConfirmLegacyGasDisplay;
