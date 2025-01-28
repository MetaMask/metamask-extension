import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../contexts/i18n';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import Typography from '../../../../components/ui/typography';
import Button from '../../../../components/ui/button';
import Box from '../../../../components/ui/box';
import {
  TypographyVariant,
  DISPLAY,
  FLEX_DIRECTION,
  BLOCK_SIZES,
} from '../../../../helpers/constants/design-system';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import LoadingHeartBeat from '../../../../components/ui/loading-heartbeat';
import TransactionDetailItem from '../../components/transaction-detail-item';
import { ConfirmGasDisplay } from '../../components/confirm-gas-display';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';
import TransactionDetail from '../../components/transaction-detail';
import ActionableMessage from '../../../../components/ui/actionable-message';
import {
  getPreferences,
  transactionFeeSelector,
  getIsTestnet,
  getUseCurrencyRateCheck,
  getUnapprovedTransactions,
  selectNetworkConfigurationByChainId,
} from '../../../../selectors';

import { INSUFFICIENT_TOKENS_ERROR } from '../send.constants';
import { getCurrentDraftTransaction } from '../../../../ducks/send';
import { showModal } from '../../../../store/actions';
import {
  addHexes,
  hexWEIToDecETH,
} from '../../../../../shared/modules/conversion.utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import useRamps from '../../../../hooks/ramps/useRamps/useRamps';
import { getIsNativeTokenBuyable } from '../../../../ducks/ramps';

// This function is no longer used in codebase, to be deleted.
export default function GasDisplay({ gasError }) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const { estimateUsed, transaction } = useGasFeeContext();
  const { chainId } = transaction;
  const trackEvent = useContext(MetaMetricsContext);
  const { openBuyCryptoInPdapp } = useRamps();

  const { name: networkNickname, nativeCurrency } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const isTestnet = useSelector(getIsTestnet);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const { showFiatInTestnets } = useSelector(getPreferences);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const networkName = NETWORK_TO_NAME_MAP[chainId];
  const isInsufficientTokenError =
    draftTransaction?.amount?.error === INSUFFICIENT_TOKENS_ERROR;
  const editingTransaction = unapprovedTxs[draftTransaction.id];
  const currentNetworkName = networkName || networkNickname;

  const transactionData = {
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

  const { hexMaximumTransactionFee, hexTransactionTotal } = useSelector(
    (state) => transactionFeeSelector(state, transactionData),
  );

  let title;
  if (
    draftTransaction?.sendAsset.details?.standard === TokenStandard.ERC721 ||
    draftTransaction?.sendAsset.details?.standard === TokenStandard.ERC1155
  ) {
    title = draftTransaction?.sendAsset.details?.name;
  } else if (
    draftTransaction?.sendAsset.details?.standard === TokenStandard.ERC20
  ) {
    title = `${hexWEIToDecETH(draftTransaction.amount.value)} ${
      draftTransaction?.sendAsset.details?.symbol
    }`;
  }

  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(hexMaximumTransactionFee),
  );

  const primaryTotalTextOverrideMaxAmount = `${title} + ${ethTransactionTotalMaxAmount} ${nativeCurrency}`;

  const showCurrencyRateCheck =
    useCurrencyRateCheck && (!isTestnet || showFiatInTestnets);

  let detailTotal, maxAmount;

  if (draftTransaction?.sendAsset.type === 'NATIVE') {
    detailTotal = (
      <Box
        height={BLOCK_SIZES.MAX}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        className="gas-display__total-value"
      >
        <LoadingHeartBeat estimateUsed={transactionData?.userFeeLevel} />
        <UserPreferencedCurrencyDisplay
          type={PRIMARY}
          key="total-detail-value"
          value={hexTransactionTotal}
        />
      </Box>
    );
    maxAmount = (
      <UserPreferencedCurrencyDisplay
        type={PRIMARY}
        key="total-max-amount"
        value={addHexes(
          draftTransaction.amount.value,
          hexMaximumTransactionFee,
        )}
      />
    );
  } else {
    detailTotal = primaryTotalTextOverrideMaxAmount;
    maxAmount = primaryTotalTextOverrideMaxAmount;
  }
  return (
    <>
      <Box className="gas-display">
        <TransactionDetail
          userAcknowledgedGasMissing={false}
          rows={[
            <ConfirmGasDisplay key="gas-display" />,
            (gasError || isInsufficientTokenError) && (
              <TransactionDetailItem
                key="gas-display-total-item"
                detailTitle={t('total')}
                detailText={
                  showCurrencyRateCheck && (
                    <Box
                      height={BLOCK_SIZES.MAX}
                      display={DISPLAY.FLEX}
                      flexDirection={FLEX_DIRECTION.COLUMN}
                      className="gas-display__total-value"
                    >
                      <LoadingHeartBeat
                        estimateUsed={transactionData?.userFeeLevel}
                      />
                      <UserPreferencedCurrencyDisplay
                        type={SECONDARY}
                        key="total-detail-text"
                        value={hexTransactionTotal}
                        hideLabel
                      />
                    </Box>
                  )
                }
                detailTotal={detailTotal}
                subTitle={t('transactionDetailGasTotalSubtitle')}
                subText={
                  <Box
                    height={BLOCK_SIZES.MAX}
                    display={DISPLAY.FLEX}
                    flexDirection={FLEX_DIRECTION.COLUMN}
                    className="gas-display__total-amount"
                  >
                    <LoadingHeartBeat
                      estimateUsed={
                        transactionData?.userFeeLevel ?? estimateUsed
                      }
                    />
                    <strong key="editGasSubTextAmountLabel">
                      {t('editGasSubTextAmountLabel')}
                    </strong>{' '}
                    {maxAmount}
                  </Box>
                }
              />
            ),
          ]}
        />
      </Box>
      {(gasError || isInsufficientTokenError) && currentNetworkName && (
        <Box
          className="gas-display__warning-message"
          data-testid="gas-warning-message"
        >
          <Box
            paddingTop={0}
            paddingRight={4}
            paddingBottom={4}
            paddingLeft={4}
            className="gas-display__confirm-approve-content__warning"
          >
            <ActionableMessage
              message={
                isBuyableChain &&
                draftTransaction.sendAsset.type === 'NATIVE' ? (
                  <Typography variant={TypographyVariant.H7} align="left">
                    {t('insufficientCurrencyBuyOrReceive', [
                      nativeCurrency,
                      currentNetworkName,
                      <Button
                        type="inline"
                        className="confirm-page-container-content__link"
                        onClick={() => {
                          openBuyCryptoInPdapp();
                          trackEvent({
                            event: MetaMetricsEventName.NavBuyButtonClicked,
                            category: MetaMetricsEventCategory.Navigation,
                            properties: {
                              location: 'Gas Warning Insufficient Funds',
                              text: 'Buy',
                            },
                          });
                        }}
                        key={`${nativeCurrency}-buy-button`}
                      >
                        {t('buyAsset', [nativeCurrency])}
                      </Button>,
                      <Button
                        type="inline"
                        className="gas-display__link"
                        onClick={() =>
                          dispatch(showModal({ name: 'ACCOUNT_DETAILS' }))
                        }
                        key="receive-button"
                      >
                        {t('deposit')}
                      </Button>,
                    ])}
                  </Typography>
                ) : (
                  <Typography variant={TypographyVariant.H7} align="left">
                    {t('insufficientCurrencyBuyOrReceive', [
                      nativeCurrency,
                      currentNetworkName,
                      `${t('buyAsset', [nativeCurrency])}`,
                      <Button
                        type="inline"
                        className="gas-display__link"
                        onClick={() =>
                          dispatch(showModal({ name: 'ACCOUNT_DETAILS' }))
                        }
                        key="receive-button"
                      >
                        {t('deposit')}
                      </Button>,
                    ])}
                  </Typography>
                )
              }
              useIcon
              iconFillColor="var(--color-error-default)"
              type="danger"
            />
          </Box>
        </Box>
      )}
    </>
  );
}
GasDisplay.propTypes = {
  gasError: PropTypes.string,
};
