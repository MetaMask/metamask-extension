import React, { useContext, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
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
  const { estimateUsed, supportsEIP1559V2 } = useGasFeeContext();
  const [showDepositPopover, setShowDepositPopover] = useState(false);
  const currentProvider = useSelector(getProvider);
  const isMainnet = useSelector(getIsMainnet);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const { nativeCurrency, provider, unapprovedTxs } = useSelector(
    (state) => state.metamask,
  );
  const { chainId } = provider;
  const networkName = NETWORK_TO_NAME_MAP[chainId];
  const isInsufficientTokenError =
    draftTransaction?.amount.error === INSUFFICIENT_TOKENS_ERROR;
  const editingTransaction = unapprovedTxs[draftTransaction.id];

  const txData = {
    txParams: {
      gasPrice: draftTransaction.gas?.gasPrice,
      gas: editingTransaction?.userEditedGasLimit
        ? editingTransaction?.txParams?.gas
        : draftTransaction.gas?.gasLimit,
      maxFeePerGas: draftTransaction.gas?.maxFeePerGas,
      maxPriorityFeePerGas: draftTransaction.gas?.maxPriorityFeePerGas,
      value: draftTransaction.amount?.value,
      type: draftTransaction.transactionType,
    },
    userFeeLevel: editingTransaction?.userFeeLevel,
  };

  const {
    hexMinimumTransactionFee,
    hexMaximumTransactionFee,
    hexTransactionTotal,
  } = useSelector((state) => transactionFeeSelector(state, txData));

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

  let detailTotal, maxAmount;

  if (draftTransaction?.asset.type === 'NATIVE') {
    detailTotal = (
      <Box
        height={BLOCK_SIZES.MAX}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        className="gas-display__total-value"
      >
        <LoadingHeartBeat estimateUsed={txData?.userFeeLevel} />
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
                    position="right"
                  >
                    <i className="fa fa-info-circle" />
                  </InfoTooltip>
                </>
              }
              detailText={
                <Box
                  height={BLOCK_SIZES.MAX}
                  display={DISPLAY.FLEX}
                  flexDirection={FLEX_DIRECTION.COLUMN}
                  className="gas-display__currency-container"
                >
                  <LoadingHeartBeat estimateUsed={txData?.userFeeLevel} />
                  <UserPreferencedCurrencyDisplay
                    type={SECONDARY}
                    value={hexMinimumTransactionFee}
                    hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                  />
                </Box>
              }
              detailTotal={
                <Box
                  height={BLOCK_SIZES.MAX}
                  display={DISPLAY.FLEX}
                  flexDirection={FLEX_DIRECTION.COLUMN}
                  className="gas-display__currency-container"
                >
                  <LoadingHeartBeat estimateUsed={txData?.userFeeLevel} />
                  <UserPreferencedCurrencyDisplay
                    type={PRIMARY}
                    value={hexMinimumTransactionFee}
                    hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                    numberOfDecimals={6}
                  />
                </Box>
              }
              subText={
                <>
                  <strong key="editGasSubTextFeeLabel">
                    {t('editGasSubTextFeeLabel')}
                  </strong>
                  <Box
                    height={BLOCK_SIZES.MAX}
                    display={DISPLAY.FLEX}
                    flexDirection={FLEX_DIRECTION.COLUMN}
                    className="gas-display__currency-container"
                  >
                    <LoadingHeartBeat
                      estimateUsed={txData?.userFeeLevel ?? estimateUsed}
                    />
                    <UserPreferencedCurrencyDisplay
                      key="editGasSubTextFeeAmount"
                      type={PRIMARY}
                      value={hexMaximumTransactionFee}
                      hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                    />
                  </Box>
                </>
              }
              subTitle={
                <>
                  <GasTiming
                    maxPriorityFeePerGas={hexWEIToDecGWEI(
                      draftTransaction.gas.maxPriorityFeePerGas,
                    )}
                    maxFeePerGas={hexWEIToDecGWEI(
                      draftTransaction.gas.maxFeePerGas,
                    )}
                  />
                </>
              }
            />,
            !supportsEIP1559V2 && (gasError || isInsufficientTokenError) && (
              <TransactionDetailItem
                key="total-item"
                detailTitle={t('total')}
                detailText={
                  <Box
                    height={BLOCK_SIZES.MAX}
                    display={DISPLAY.FLEX}
                    flexDirection={FLEX_DIRECTION.COLUMN}
                    className="gas-display__total-value"
                  >
                    <LoadingHeartBeat estimateUsed={txData?.userFeeLevel} />
                    <UserPreferencedCurrencyDisplay
                      type={SECONDARY}
                      key="total-detail-text"
                      value={hexTransactionTotal}
                      hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                    />
                  </Box>
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
                      estimateUsed={txData?.userFeeLevel ?? estimateUsed}
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
      {!supportsEIP1559V2 && (gasError || isInsufficientTokenError) && (
        <Box className="gas-display__warning-message">
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
                      networkName ?? currentProvider.nickname,
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
                      networkName ?? currentProvider.nickname,
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
