import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import Button from '../../ui/button';
import EditGasFeeButton from '../edit-gas-fee-button/edit-gas-fee-button';
import Typography from '../../ui/typography/typography';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../../.storybook/i18n';
import GasDetailsItem from '../gas-details-item/gas-details-item';
import ActionableMessage from '../../ui/actionable-message';
import MultiLayerFeeMessage from '../multilayer-fee-message/multi-layer-fee-message';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';

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
  hexTransactionTotal,
  fiatTransactionTotal,
  currentCurrency,
  isSetApproveForAll,
  isApprovalOrRejection,
  data,
}) {
  const t = useContext(I18nContext);
  const [userAcknowledgedGasMissing, setUserAcknowledgedGasMissing] =
    useState(false);
  const hasSimulationError = Boolean(fullTxData.simulationFails);
  const renderSimulationFailureWarning =
    hasSimulationError && !userAcknowledgedGasMissing;

  return (
    <Box
      className={classnames({
        'approve-content-card-container__card': !noBorder,
        'approve-content-card-container__card--no-border': noBorder,
      })}
    >
      {renderSimulationFailureWarning && (
        <Box paddingTop={0} paddingRight={4} paddingBottom={4} paddingLeft={4}>
          <ActionableMessage
            message={t('simulationErrorMessageV2')}
            useIcon
            iconFillColor="var(--color-error-default)"
            type="danger"
            primaryActionV2={
              userAcknowledgedGasMissing === true
                ? undefined
                : {
                    label: t('proceedWithTransaction'),
                    onClick: () => setUserAcknowledgedGasMissing(true),
                  }
            }
          />
        </Box>
      )}
      {showHeader && (
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
          alignItems={ALIGN_ITEMS.CENTER}
          justifyContent={JUSTIFY_CONTENT.FLEX_END}
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
                <Typography
                  variant={TYPOGRAPHY.H6}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {title}
                </Typography>
              </Box>
            </>
          )}
          {showEdit && (!showAdvanceGasFeeOptions || !supportsEIP1559) && (
            <Box width={BLOCK_SIZES.ONE_SIXTH}>
              <Button type="link" onClick={() => onEditClick()}>
                <Typography
                  variant={TYPOGRAPHY.H7}
                  color={COLORS.PRIMARY_DEFAULT}
                >
                  {t('edit')}
                </Typography>
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
            <GasDetailsItem
              userAcknowledgedGasMissing={userAcknowledgedGasMissing}
            />
          ) : (
            <Box
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.ROW}
              justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
            >
              {isMultiLayerFeeNetwork ? (
                <Box
                  display={DISPLAY.FLEX}
                  flexDirection={FLEX_DIRECTION.COLUMN}
                  className="approve-content-card-container__transaction-details-extra-content"
                >
                  <Box
                    display={DISPLAY.FLEX}
                    justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
                  >
                    <Typography
                      variant={TYPOGRAPHY.H6}
                      fontWeight={FONT_WEIGHT.NORMAL}
                      color={COLORS.TEXT_MUTED}
                    >
                      <span>{t('transactionDetailLayer2GasHeading')}</span>
                      {`${ethTransactionTotal} ${nativeCurrency}`}
                    </Typography>
                  </Box>
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
                    <Typography
                      variant={TYPOGRAPHY.H7}
                      color={COLORS.TEXT_ALTERNATIVE}
                    >
                      {t('feeAssociatedRequest')}
                    </Typography>
                  </Box>
                  <Box
                    display={DISPLAY.FLEX}
                    flexDirection={FLEX_DIRECTION.COLUMN}
                    alignItems={ALIGN_ITEMS.FLEX_END}
                    textAlign={TEXT_ALIGN.RIGHT}
                  >
                    <Box>
                      <Typography
                        variant={TYPOGRAPHY.H4}
                        fontWeight={FONT_WEIGHT.BOLD}
                        color={COLORS.TEXT_DEFAULT}
                      >
                        {formatCurrency(fiatTransactionTotal, currentCurrency)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant={TYPOGRAPHY.H6}
                        fontWeight={FONT_WEIGHT.NORMAL}
                        color={COLORS.TEXT_MUTED}
                      >
                        {`${ethTransactionTotal} ${nativeCurrency}`}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          ))}
        {renderDataContent && (
          <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
            <Box>
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.TEXT_ALTERNATIVE}
              >
                {isSetApproveForAll
                  ? t('functionSetApprovalForAll')
                  : t('functionApprove')}
              </Typography>
            </Box>
            {isSetApproveForAll && isApprovalOrRejection !== undefined ? (
              <Box>
                <Typography
                  variant={TYPOGRAPHY.H7}
                  color={COLORS.TEXT_ALTERNATIVE}
                >
                  {`${t('parameters')}: ${isApprovalOrRejection}`}
                </Typography>
              </Box>
            ) : null}
            <Box
              marginRight={4}
              className="approve-content-card-container__data__data-block"
            >
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.TEXT_ALTERNATIVE}
              >
                {data}
              </Typography>
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
};
