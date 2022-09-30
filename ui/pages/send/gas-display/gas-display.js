import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { hexWEIToDecGWEI } from '../../../../shared/lib/transactions-controller-utils';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
import GasTiming from '../../../components/app/gas-timing';
import InfoTooltip from '../../../components/ui/info-tooltip/info-tooltip';
import LedgerInstructionField from '../../../components/app/ledger-instruction-field';
import Typography from '../../../components/ui/typography/typography';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import {
  TYPOGRAPHY,
  DISPLAY,
  FLEX_DIRECTION,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';
import LoadingHeartBeat from '../../../components/ui/loading-heartbeat';
import TransactionDetailItem from '../../../components/app/transaction-detail-item';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import TransactionDetail from '../../../components/app/transaction-detail';
import ActionableMessage from '../../../components/ui/actionable-message';
import DepositPopover from '../../../components/app/deposit-popover';
import { getProvider } from '../../../selectors';
import { INSUFFICIENT_TOKENS_ERROR } from '../send.constants';

const renderHeartBeatIfNotInTest = () =>
  process.env.IN_TEST ? null : <LoadingHeartBeat />;
export default function GasDisplay({
  draftTransaction,
  detailText,
  detailTotal,
  maxAmount,
  useNativeCurrencyAsPrimaryCurrency,
  maxFeePerGas,
  maxPriorityFeePerGas,
  isMainnet,
  showLedgerSteps,
  isBuyableChain,
  hexMinimumTransactionFee,
  hexMaximumTransactionFee,
  nativeCurrency,
  chainId,
  showAccountDetails,
  gasError,
}) {
  const t = useContext(I18nContext);
  const { estimateUsed, supportsEIP1559V2 } = useGasFeeContext();
  const [showDepositPopover, setShowDepositPopover] = useState(false);
  const currentProvider = useSelector(getProvider);
  const networkName = NETWORK_TO_NAME_MAP[chainId];
  const isInsufficientTokenError =
    draftTransaction?.amount.error === INSUFFICIENT_TOKENS_ERROR;

  const renderGasDetailsItem = () => {
    return (
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
              position="top"
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
            {renderHeartBeatIfNotInTest()}
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
            {renderHeartBeatIfNotInTest()}
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
              {renderHeartBeatIfNotInTest()}
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
                maxPriorityFeePerGas ||
                  draftTransaction.gas.maxPriorityFeePerGas,
              )}
              maxFeePerGas={hexWEIToDecGWEI(
                maxFeePerGas || draftTransaction.gas.maxFeePerGas,
              )}
            />
          </>
        }
      />
    );
  };
  return (
    <>
      {showDepositPopover && (
        <DepositPopover onClose={() => setShowDepositPopover(false)} />
      )}
      <Box className="gas-display">
        <TransactionDetail
          userAcknowledgedGasMissing={false}
          rows={[
            renderGasDetailsItem(),
            !supportsEIP1559V2 && (gasError || isInsufficientTokenError) && (
              <TransactionDetailItem
                key="total-item"
                detailTitle={t('total')}
                detailText={detailText}
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
                        draftTransaction?.userFeeLevel ?? estimateUsed
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
        {showLedgerSteps ? (
          <LedgerInstructionField
            showDataInstruction={Boolean(
              draftTransaction.userInputHexData ?? undefined,
            )}
          />
        ) : null}
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
                        onClick={showAccountDetails}
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
                        onClick={showAccountDetails}
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
  draftTransaction: PropTypes.object,
  detailText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  detailTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  maxAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
  maxFeePerGas: PropTypes.string,
  maxPriorityFeePerGas: PropTypes.string,
  isMainnet: PropTypes.bool,
  showLedgerSteps: PropTypes.bool,
  isBuyableChain: PropTypes.bool,
  hexMinimumTransactionFee: PropTypes.string,
  hexMaximumTransactionFee: PropTypes.string,
  nativeCurrency: PropTypes.string,
  chainId: PropTypes.string,
  showAccountDetails: PropTypes.func,
  gasError: PropTypes.string,
};
