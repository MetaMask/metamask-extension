import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getIsMainnet,
  getIsMultiLayerFeeNetwork,
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
import {
  FONT_STYLE,
  TextVariant,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useDraftTransactionWithTxParams } from '../../../../hooks/useDraftTransactionWithTxParams';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import MultilayerFeeMessage from '../../multilayer-fee-message/multi-layer-fee-message';
import { Icon, IconName, Text } from '../../../component-library';

const renderHeartBeatIfNotInTest = () =>
  process.env.IN_TEST ? null : <LoadingHeartBeat />;

const ConfirmLegacyGasDisplay = ({ 'data-testid': dataTestId } = {}) => {
  const t = useI18nContext();

  // state selectors
  const isMainnet = useSelector(getIsMainnet);
  const isMultiLayerFeeNetwork = useSelector(getIsMultiLayerFeeNetwork);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const nativeCurrency = useSelector(getNativeCurrency);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const transactionData = useDraftTransactionWithTxParams();
  const txData = useSelector((state) => txDataSelector(state));
  const { id: transactionId, dappSuggestedGasFees } = txData;
  const transaction = Object.keys(transactionData).length
    ? transactionData
    : unapprovedTxs[transactionId] || {};
  const { hexMinimumTransactionFee, hexMaximumTransactionFee } = useSelector(
    (state) => transactionFeeSelector(state, transaction),
  );

  if (isMultiLayerFeeNetwork) {
    return [
      <TransactionDetailItem
        key="legacy-total-item"
        data-testid={dataTestId}
        detailTitle={t('transactionDetailLayer2GasHeading')}
        detailTotal={
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            value={hexMinimumTransactionFee}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
            numberOfDecimals={18}
          />
        }
        detailText={
          useCurrencyRateCheck && (
            <UserPreferencedCurrencyDisplay
              type={SECONDARY}
              value={hexMinimumTransactionFee}
              hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
            />
          )
        }
        noBold
        flexWidthValues
      />,
      <MultilayerFeeMessage
        key="confirm-layer-1"
        transaction={txData}
        layer2fee={hexMinimumTransactionFee}
        nativeCurrency={nativeCurrency}
      />,
    ];
  }

  return (
    <TransactionDetailItem
      key="legacy-gas-details"
      data-testid={dataTestId}
      detailTitle={
        dappSuggestedGasFees ? (
          <>
            {t('transactionDetailGasHeading')}
            <InfoTooltip
              contentText={t('transactionDetailDappGasTooltip')}
              position="top"
            >
              <Icon name={IconName.Info} />
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
              <Icon name={IconName.Info} />
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

ConfirmLegacyGasDisplay.propTypes = {
  'data-testid': PropTypes.string,
};

export default ConfirmLegacyGasDisplay;
