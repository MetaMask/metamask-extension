import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import BigNumber from 'bignumber.js';
import { EditGasModes } from '../../../../shared/constants/gas';

import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';

import {
  COLORS,
  TEXT_ALIGN,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import { areDappSuggestedAndTxParamGasFeesTheSame } from '../../../helpers/utils/confirm-tx.util';

import InfoTooltip from '../../ui/info-tooltip';
import ErrorMessage from '../../ui/error-message';
import AdvancedGasControls from '../advanced-gas-controls/advanced-gas-controls.component';
import ActionableMessage from '../../ui/actionable-message/actionable-message';

import { I18nContext } from '../../../contexts/i18n';

export default function EditGasDisplay({
  mode = EditGasModes.modifyInPlace,
  estimatedMinimumNative,
  transaction,
  gasPrice,
  setGasPrice,
  gasLimit,
  setGasLimit,
  properGasLimit,
  dappSuggestedGasFeeAcknowledged,
  setDappSuggestedGasFeeAcknowledged,
  onManualChange,
  minimumGasLimit,
  balanceError,
  gasErrors,
  txParamsHaveBeenCustomized,
}) {
  const t = useContext(I18nContext);
  const scrollRef = useRef(null);

  const dappSuggestedAndTxParamGasFeesAreTheSame =
    areDappSuggestedAndTxParamGasFeesTheSame(transaction);

  const requireDappAcknowledgement = Boolean(
    transaction?.dappSuggestedGasFees &&
      !dappSuggestedGasFeeAcknowledged &&
      dappSuggestedAndTxParamGasFeesAreTheSame,
  );

  let warningMessage;
  if (
    gasLimit !== undefined &&
    properGasLimit !== undefined &&
    new BigNumber(gasLimit).lessThan(new BigNumber(properGasLimit))
  ) {
    warningMessage = t('gasLimitRecommended', [properGasLimit]);
  }

  const showTopError = balanceError && txParamsHaveBeenCustomized;

  let errorKey;
  if (balanceError) {
    errorKey = 'insufficientFunds';
  }

  return (
    <div className="edit-gas-display">
      <div className="edit-gas-display__content">
        {showTopError && (
          <div className="edit-gas-display__warning">
            <ErrorMessage errorKey={errorKey} />
          </div>
        )}
        {warningMessage && (
          <div className="edit-gas-display__warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={warningMessage}
              iconFillColor="var(--color-warning-default)"
              useIcon
            />
          </div>
        )}
        {requireDappAcknowledgement && (
          <div className="edit-gas-display__dapp-acknowledgement-warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={t('gasDisplayDappWarning', [transaction.origin])}
              iconFillColor="var(--color-warning-default)"
              useIcon
            />
          </div>
        )}
        {mode === EditGasModes.speedUp && (
          <div className="edit-gas-display__top-tooltip">
            <Typography
              color={COLORS.TEXT_DEFAULT}
              variant={TYPOGRAPHY.H8}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('speedUpTooltipText')}{' '}
              <InfoTooltip
                position="top"
                contentText={t('speedUpExplanation')}
              />
            </Typography>
          </div>
        )}
        <Typography
          color={COLORS.TEXT_DEFAULT}
          variant={TYPOGRAPHY.H1}
          align={TEXT_ALIGN.CENTER}
        >
          {estimatedMinimumNative}
        </Typography>
        {requireDappAcknowledgement && (
          <Button
            className="edit-gas-display__dapp-acknowledgement-button"
            onClick={() => setDappSuggestedGasFeeAcknowledged(true)}
          >
            {t('gasDisplayAcknowledgeDappButtonText')}
          </Button>
        )}
        {!requireDappAcknowledgement && (
          <AdvancedGasControls
            gasLimit={gasLimit}
            setGasLimit={setGasLimit}
            gasPrice={gasPrice}
            setGasPrice={setGasPrice}
            onManualChange={onManualChange}
            minimumGasLimit={minimumGasLimit}
            gasErrors={gasErrors}
          />
        )}
      </div>
      <div ref={scrollRef} className="edit-gas-display__scroll-bottom" />
    </div>
  );
}

EditGasDisplay.propTypes = {
  mode: PropTypes.oneOf(Object.values(EditGasModes)),
  estimatedMinimumNative: PropTypes.string,
  gasPrice: PropTypes.string,
  setGasPrice: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  properGasLimit: PropTypes.number,
  dappSuggestedGasFeeAcknowledged: PropTypes.bool,
  setDappSuggestedGasFeeAcknowledged: PropTypes.func,
  transaction: PropTypes.object,
  onManualChange: PropTypes.func,
  minimumGasLimit: PropTypes.string,
  balanceError: PropTypes.bool,
  gasErrors: PropTypes.object,
  txParamsHaveBeenCustomized: PropTypes.bool,
};
