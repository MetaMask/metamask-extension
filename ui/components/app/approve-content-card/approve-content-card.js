import React, { useContext } from 'react';
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
  supportsEIP1559V2,
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

  return (
    <Box
      className={classnames({
        'approve-content-card-container__card': !noBorder,
        'approve-content-card-container__card--no-border': noBorder,
      })}
    >
      {showHeader && (
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
          alignItems={ALIGN_ITEMS.CENTER}
          justifyContent={JUSTIFY_CONTENT.FLEX_END}
          className="approve-content-card-container__card-header"
        >
          {supportsEIP1559V2 && title === t('transactionFee') ? null : (
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
          {showEdit && (!showAdvanceGasFeeOptions || !supportsEIP1559V2) && (
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
          {showEdit && showAdvanceGasFeeOptions && supportsEIP1559V2 && (
            <EditGasFeeButton />
          )}
        </Box>
      )}
      <Box
        marginTop={1}
        marginBottom={3}
        className="approve-content-card-container__card-content"
      >
        {renderTransactionDetailsContent &&
          (!isMultiLayerFeeNetwork && supportsEIP1559V2 ? (
            <GasDetailsItem />
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
  showHeader: PropTypes.bool,
  symbol: PropTypes.node,
  title: PropTypes.string,
  showEdit: PropTypes.bool,
  showAdvanceGasFeeOptions: PropTypes.bool,
  onEditClick: PropTypes.func,
  footer: PropTypes.node,
  noBorder: PropTypes.bool,
  supportsEIP1559V2: PropTypes.bool,
  renderTransactionDetailsContent: PropTypes.bool,
  renderDataContent: PropTypes.bool,
  isMultiLayerFeeNetwork: PropTypes.bool,
  ethTransactionTotal: PropTypes.string,
  nativeCurrency: PropTypes.string,
  fullTxData: PropTypes.object,
  hexTransactionTotal: PropTypes.string,
  fiatTransactionTotal: PropTypes.string,
  currentCurrency: PropTypes.string,
  isSetApproveForAll: PropTypes.bool,
  isApprovalOrRejection: PropTypes.bool,
  data: PropTypes.string,
};
