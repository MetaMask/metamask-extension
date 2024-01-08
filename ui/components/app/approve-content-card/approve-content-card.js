import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';

import Box from '../../ui/box/box';
import Button from '../../ui/button';
import EditGasFeeButton from '../edit-gas-fee-button/edit-gas-fee-button';
import { Text } from '../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { I18nContext } from '../../../contexts/i18n';
import { getPreferences } from '../../../selectors';
import { ConfirmGasDisplay } from '../confirm-gas-display';
import MultiLayerFeeMessage from '../multilayer-fee-message/multi-layer-fee-message';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';

export default function ApproveContentCard({
  showHeader = true,
  symbol,
  title,
  showEdit,
  showAdvanceGasFeeOptions = false,
  onEditClick,
  footer,
  noBorder,
  supportsEIP1559,
  renderTransactionDetailsContent,
  renderDataContent,
  isMultiLayerFeeNetwork,
  ethTransactionTotal,
  nativeCurrency,
  fullTxData,
  hexMinimumTransactionFee,
  hexTransactionTotal,
  fiatTransactionTotal,
  currentCurrency,
  isSetApproveForAll,
  isApprovalOrRejection,
  data,
  userAcknowledgedGasMissing,
  renderSimulationFailureWarning,
  useCurrencyRateCheck,
}) {
  const t = useContext(I18nContext);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);

  return (
    <Box
      className={classnames({
        'approve-content-card-container__card': !noBorder,
        'approve-content-card-container__card--no-border': noBorder,
      })}
    >
      {showHeader && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.flexEnd}
          className="approve-content-card-container__card-header"
        >
          {supportsEIP1559 && title === t('transactionFee') ? null : (
            <>
              <Box className="approve-content-card-container__card-header__symbol">
                {symbol}
              </Box>
              <Box
                marginLeft={4}
                className="approve-content-card-container__card-header__title"
              >
                <Text variant={TextVariant.bodySmBold} as="h6">
                  {title}
                </Text>
              </Box>
            </>
          )}
          {showEdit && (!showAdvanceGasFeeOptions || !supportsEIP1559) && (
            <Box width={BlockSize.OneSixth}>
              <Button type="link" onClick={() => onEditClick()}>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.primaryDefault}
                  as="h6"
                >
                  {t('edit')}
                </Text>
              </Button>
            </Box>
          )}
          {showEdit &&
            showAdvanceGasFeeOptions &&
            supportsEIP1559 &&
            !renderSimulationFailureWarning && (
              <EditGasFeeButton
                userAcknowledgedGasMissing={userAcknowledgedGasMissing}
              />
            )}
        </Box>
      )}
      <Box
        marginTop={1}
        marginBottom={3}
        className="approve-content-card-container__card-content"
      >
        {renderTransactionDetailsContent &&
          (!isMultiLayerFeeNetwork &&
          supportsEIP1559 &&
          !renderSimulationFailureWarning ? (
            <ConfirmGasDisplay
              userAcknowledgedGasMissing={userAcknowledgedGasMissing}
            />
          ) : (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
            >
              {isMultiLayerFeeNetwork ? (
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  className="approve-content-card-container__transaction-details-extra-content"
                >
                  <TransactionDetailItem
                    key="approve-content-card-min-tx-fee"
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
                      <UserPreferencedCurrencyDisplay
                        type={SECONDARY}
                        value={hexMinimumTransactionFee}
                        hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                      />
                    }
                    noBold
                    flexWidthValues
                  />
                  <MultiLayerFeeMessage
                    transaction={fullTxData}
                    layer2fee={hexTransactionTotal}
                    nativeCurrency={nativeCurrency}
                    plainStyle
                  />
                </Box>
              ) : (
                <>
                  <Box>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                      as="h6"
                    >
                      {t('feeAssociatedRequest')}
                    </Text>
                  </Box>
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                    alignItems={AlignItems.flexEnd}
                    textAlign={TextAlign.Right}
                  >
                    {useCurrencyRateCheck && (
                      <Box>
                        <Text
                          variant={TextVariant.headingSm}
                          fontWeight={FontWeight.Bold}
                          color={TextColor.textDefault}
                          as="h4"
                        >
                          {formatCurrency(
                            fiatTransactionTotal,
                            currentCurrency,
                          )}
                        </Text>
                      </Box>
                    )}
                    <Box>
                      <Text
                        variant={TextVariant.bodySm}
                        fontWeight={FontWeight.Normal}
                        color={TextColor.textMuted}
                        as="h6"
                      >
                        {`${ethTransactionTotal} ${nativeCurrency}`}
                      </Text>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          ))}
        {renderDataContent && (
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            <Box>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                as="h6"
              >
                {isSetApproveForAll
                  ? t('functionSetApprovalForAll')
                  : t('functionApprove')}
              </Text>
            </Box>
            {isSetApproveForAll && isApprovalOrRejection !== undefined ? (
              <Box>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  as="h6"
                >
                  {`${t('parameters')}: ${isApprovalOrRejection}`}
                </Text>
              </Box>
            ) : null}
            <Box
              marginRight={4}
              className="approve-content-card-container__data__data-block"
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                as="h6"
              >
                {data}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
      {footer}
    </Box>
  );
}

ApproveContentCard.propTypes = {
  /**
   * Whether to show header including icon, transaction fee text and edit button
   */
  showHeader: PropTypes.bool,
  /**
   * Symbol icon
   */
  symbol: PropTypes.node,
  /**
   * Title to be included in the header
   */
  title: PropTypes.string,
  /**
   * Whether to show edit button or not
   */
  showEdit: PropTypes.bool,
  /**
   * Whether to show advanced gas fee options or not
   */
  showAdvanceGasFeeOptions: PropTypes.bool,
  /**
   * Should open customize gas modal when edit button is clicked
   */
  onEditClick: PropTypes.func,
  /**
   * Footer to be shown
   */
  footer: PropTypes.node,
  /**
   * Whether to include border-bottom or not
   */
  noBorder: PropTypes.bool,
  /**
   * Is enhanced gas fee enabled or not
   */
  supportsEIP1559: PropTypes.bool,
  /**
   * Whether to render transaction details content or not
   */
  renderTransactionDetailsContent: PropTypes.bool,
  /**
   * Whether to render data content or not
   */
  renderDataContent: PropTypes.bool,
  /**
   * Is multi-layer fee network or not
   */
  isMultiLayerFeeNetwork: PropTypes.bool,
  /**
   * Total sum of the transaction in native currency
   */
  ethTransactionTotal: PropTypes.string,
  /**
   * Current native currency
   */
  nativeCurrency: PropTypes.string,
  /**
   * Current transaction
   */
  fullTxData: PropTypes.object,
  /**
   * Total sum of the transaction converted to hex value
   */
  hexTransactionTotal: PropTypes.string,
  /**
   * Minimum transaction fee converted to hex value
   */
  hexMinimumTransactionFee: PropTypes.string,
  /**
   * Total sum of the transaction in fiat currency
   */
  fiatTransactionTotal: PropTypes.string,
  /**
   * Current fiat currency
   */
  currentCurrency: PropTypes.string,
  /**
   * Is set approve for all or not
   */
  isSetApproveForAll: PropTypes.bool,
  /**
   * Whether a current set approval for all transaction will approve or revoke access
   */
  isApprovalOrRejection: PropTypes.bool,
  /**
   * Current transaction data
   */
  data: PropTypes.string,
  /**
   * User acknowledge gas is missing or not
   */
  userAcknowledgedGasMissing: PropTypes.bool,
  /**
   * Render simulation failure warning
   */
  renderSimulationFailureWarning: PropTypes.bool,
  /**
   * Fiat conversion control
   */
  useCurrencyRateCheck: PropTypes.bool,
};
