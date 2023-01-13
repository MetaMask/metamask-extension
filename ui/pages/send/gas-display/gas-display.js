import React, { useContext, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { hexWEIToDecGWEI } from '../../../../shared/lib/transactions-controller-utils';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
import GasTiming from '../../../components/app/gas-timing';
import InfoTooltip from '../../../components/ui/info-tooltip';
import Typography from '../../../components/ui/typography';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import {
  TYPOGRAPHY,
  DISPLAY,
  FLEX_DIRECTION,
  BLOCK_SIZES,
  COLORS,
  FONT_STYLE,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import {
  ERC1155,
  ERC20,
  ERC721,
} from '../../../../shared/constants/transaction';
import LoadingHeartBeat from '../../../components/ui/loading-heartbeat';
import TransactionDetailItem from '../../../components/app/transaction-detail-item';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import TransactionDetail from '../../../components/app/transaction-detail';
import ActionableMessage from '../../../components/ui/actionable-message';
import DepositPopover from '../../../components/app/deposit-popover';
import {
  getProvider,
  getPreferences,
  getIsBuyableChain,
  transactionFeeSelector,
  getIsMainnet,
  getIsTestnet,
  getUseCurrencyRateCheck,
} from '../../../selectors';

import {
  hexWEIToDecETH,
  addHexes,
} from '../../../helpers/utils/conversions.util';
import { INSUFFICIENT_TOKENS_ERROR } from '../send.constants';
import { getCurrentDraftTransaction } from '../../../ducks/send';
import { showModal } from '../../../store/actions';

export default function GasDisplay({ gasError }) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const { estimateUsed } = useGasFeeContext();
  const [showDepositPopover, setShowDepositPopover] = useState(false);

  const currentProvider = useSelector(getProvider);
  const isMainnet = useSelector(getIsMainnet);
  const isTestnet = useSelector(getIsTestnet);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const { showFiatInTestnets, useNativeCurrencyAsPrimaryCurrency } =
    useSelector(getPreferences);
  const { nativeCurrency, provider, unapprovedTxs } = useSelector(
    (state) => state.metamask,
  );
  const { chainId } = provider;
  const networkName = NETWORK_TO_NAME_MAP[chainId];
  const isInsufficientTokenError =
    draftTransaction?.amount.error === INSUFFICIENT_TOKENS_ERROR;
  const editingTransaction = unapprovedTxs[draftTransaction.id];
  const currentNetworkName = networkName || currentProvider.nickname;

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

  const {
    hexMinimumTransactionFee,
    hexMaximumTransactionFee,
    hexTransactionTotal,
  } = useSelector((state) => transactionFeeSelector(state, transactionData));

  let title;
  if (
    draftTransaction?.asset.details?.standard === ERC721 ||
    draftTransaction?.asset.details?.standard === ERC1155
  ) {
    title = draftTransaction?.asset.details?.name;
  } else if (draftTransaction?.asset.details?.standard === ERC20) {
    title = `${hexWEIToDecETH(draftTransaction.amount.value)} ${
      draftTransaction?.asset.details?.symbol
    }`;
  }

  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(hexMaximumTransactionFee),
  );

  const primaryTotalTextOverrideMaxAmount = `${title} + ${ethTransactionTotalMaxAmount} ${nativeCurrency}`;

  const showCurrencyRateCheck =
    useCurrencyRateCheck && (!isTestnet || showFiatInTestnets);

  let detailTotal, maxAmount;

  if (draftTransaction?.asset.type === 'NATIVE') {
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
          hideLabel={!useNativeCurrencyAsPrimaryCurrency}
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
        hideLabel={!useNativeCurrencyAsPrimaryCurrency}
      />
    );
  } else if (useNativeCurrencyAsPrimaryCurrency) {
    detailTotal = primaryTotalTextOverrideMaxAmount;
    maxAmount = primaryTotalTextOverrideMaxAmount;
  }

  return (
    <>
      {showDepositPopover && (
        <DepositPopover onClose={() => setShowDepositPopover(false)} />
      )}
      <Box className="gas-display">
        <TransactionDetail
          userAcknowledgedGasMissing={false}
          rows={[
            <TransactionDetailItem
              key="gas-item"
              detailTitle={
                <Box display={DISPLAY.FLEX}>
                  <Box marginRight={1}>{t('gas')}</Box>
                  <Typography
                    as="span"
                    marginTop={0}
                    color={COLORS.TEXT_MUTED}
                    fontStyle={FONT_STYLE.ITALIC}
                    fontWeight={FONT_WEIGHT.NORMAL}
                    className="gas-display__title__estimate"
                  >
                    ({t('transactionDetailGasInfoV2')})
                  </Typography>
                  <InfoTooltip
                    contentText={
                      <>
                        <Typography variant={TYPOGRAPHY.H7}>
                          {t('transactionDetailGasTooltipIntro', [
                            isMainnet ? t('networkNameEthereum') : '',
                          ])}
                        </Typography>
                        <Typography variant={TYPOGRAPHY.H7}>
                          {t('transactionDetailGasTooltipExplanation')}
                        </Typography>
                        <Typography variant={TYPOGRAPHY.H7}>
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
                    position="right"
                  />
                </Box>
              }
              detailTitleColor={COLORS.TEXT_DEFAULT}
              detailText={
                showCurrencyRateCheck && (
                  <Box className="gas-display__currency-container">
                    <LoadingHeartBeat estimateUsed={estimateUsed} />
                    <UserPreferencedCurrencyDisplay
                      type={SECONDARY}
                      value={hexMinimumTransactionFee}
                      hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                    />
                  </Box>
                )
              }
              detailTotal={
                <Box className="gas-display__currency-container">
                  <LoadingHeartBeat estimateUsed={estimateUsed} />
                  <UserPreferencedCurrencyDisplay
                    type={PRIMARY}
                    value={hexMinimumTransactionFee}
                    hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                  />
                </Box>
              }
              subText={
                <>
                  <Box
                    key="editGasSubTextFeeLabel"
                    display={DISPLAY.INLINE_FLEX}
                    className={classNames('gas-display__gas-fee-label', {
                      'gas-display__gas-fee-warning': estimateUsed === 'high',
                    })}
                  >
                    <LoadingHeartBeat estimateUsed={estimateUsed} />
                    <Box marginRight={1}>
                      <strong>
                        {estimateUsed === 'high' && '⚠ '}
                        {t('editGasSubTextFeeLabel')}
                      </strong>
                    </Box>
                    <Box
                      key="editGasSubTextFeeValue"
                      className="gas-display__currency-container"
                    >
                      <LoadingHeartBeat estimateUsed={estimateUsed} />
                      <UserPreferencedCurrencyDisplay
                        key="editGasSubTextFeeAmount"
                        type={PRIMARY}
                        value={hexMaximumTransactionFee}
                        hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                      />
                    </Box>
                  </Box>
                </>
              }
              subTitle={
                <GasTiming
                  maxPriorityFeePerGas={hexWEIToDecGWEI(
                    draftTransaction.gas.maxPriorityFeePerGas,
                  )}
                  maxFeePerGas={hexWEIToDecGWEI(
                    draftTransaction.gas.maxFeePerGas,
                  )}
                />
              }
            />,
            (gasError || isInsufficientTokenError) && (
              <TransactionDetailItem
                key="total-item"
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
                        hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
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
                isBuyableChain && draftTransaction.asset.type === 'NATIVE' ? (
                  <Typography variant={TYPOGRAPHY.H7} align="left">
                    {t('insufficientCurrencyBuyOrReceive', [
                      nativeCurrency,
                      currentNetworkName,
                      <Button
                        type="inline"
                        className="confirm-page-container-content__link"
                        onClick={() => {
                          setShowDepositPopover(true);
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
                  <Typography variant={TYPOGRAPHY.H7} align="left">
                    {t('insufficientCurrencyBuyOrReceive', [
                      draftTransaction.asset.details?.symbol ?? nativeCurrency,
                      currentNetworkName,
                      `${t('buyAsset', [
                        draftTransaction.asset.details?.symbol ??
                          nativeCurrency,
                      ])}`,
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
