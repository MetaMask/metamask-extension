import React from 'react';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  checkNetworkAndAccountSupports1559,
  getIsMainnet,
  getPreferences,
  getUnapprovedTransactions,
  getUseCurrencyRateCheck,
  transactionFeeSelector,
  txDataSelector,
} from '../../../../selectors';
import { hexWEIToDecGWEI } from '../../../../../shared/modules/conversion.utils';
import { isLegacyTransaction } from '../../../../helpers/utils/transactions.util';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';

import GasTiming from '../../gas-timing';
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
import { getCurrentDraftTransaction } from '../../../../ducks/send';

const renderHeartBeatIfNotInTest = () =>
  process.env.IN_TEST ? null : <LoadingHeartBeat />;

const ConfirmLegacyGasDisplay = () => {
  const t = useI18nContext();
  const draftTransaction = useSelector(getCurrentDraftTransaction);

  // state selectors
  const isMainnet = useSelector(getIsMainnet);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  let transactionData = {};
  if (Object.keys(draftTransaction).length !== 0) {
    const editingTransaction = unapprovedTxs[draftTransaction.id];
    transactionData = {
      txParams: {
        gasPrice: draftTransaction.gas?.gasPrice,
        gas: editingTransaction?.userEditedGasLimit
          ? editingTransaction?.txParams?.gas
          : draftTransaction.gas?.gasLimit,
        maxFeePerGas: editingTransaction?.txParams?.maxFeePerGas
          ? editingTransaction?.txParams?.maxFeePerGas
          : draftTransaction.gas?.maxFeePerGas,
        maxPriorityFeePerGas: editingTransaction?.txParams?.maxPriorityFeePerGas
          ? editingTransaction?.txParams?.maxPriorityFeePerGas
          : draftTransaction.gas?.maxPriorityFeePerGas,
        value: draftTransaction.amount?.value,
        type: draftTransaction.transactionType,
      },
      userFeeLevel: editingTransaction?.userFeeLevel,
    };
  }
  const txData = useSelector((state) => txDataSelector(state));
  const { id: transactionId, dappSuggestedGasFees, txParams } = txData;
  const transaction = Object.keys(draftTransaction).length
    ? transactionData
    : unapprovedTxs[transactionId] || {};
  const {
    hexMinimumTransactionFee,
    hexMaximumTransactionFee,
    gasEstimationObject,
  } = useSelector((state) => transactionFeeSelector(state, transaction));
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const isLegacyTxn = isLegacyTransaction(
    transactionData?.txParams || txParams,
  );
  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;

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
          {dappSuggestedGasFees ? (
            <Text
              variant={TextVariant.bodySm}
              fontStyle={FONT_STYLE.ITALIC}
              color={TextColor.textAlternative}
              as="h6"
            >
              {t('transactionDetailDappGasMoreInfo')}
            </Text>
          ) : (
            ''
          )}
          {supportsEIP1559 && (
            <GasTiming
              maxPriorityFeePerGas={hexWEIToDecGWEI(
                transactionData?.txParams?.maxPriorityFeePerGas ||
                  gasEstimationObject.maxPriorityFeePerGas ||
                  txParams.maxPriorityFeePerGas,
              ).toString()}
              maxFeePerGas={hexWEIToDecGWEI(
                transactionData?.txParams?.maxFeePerGas ||
                  gasEstimationObject.maxFeePerGas ||
                  txParams.maxFeePerGas,
              ).toString()}
            />
          )}
        </>
      }
    />
  );
};

export default ConfirmLegacyGasDisplay;
