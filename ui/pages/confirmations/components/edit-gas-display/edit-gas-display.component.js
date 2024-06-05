import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import BigNumber from 'bignumber.js';
import { EditGasModes } from '../../../../../shared/constants/gas';

import Button from '../../../../components/ui/button';

import {
  TextAlign,
  FontWeight,
  TextColor,
  TextVariant,
  Severity,
} from '../../../../helpers/constants/design-system';
import { BannerAlert, Text } from '../../../../components/component-library';
import { areDappSuggestedAndTxParamGasFeesTheSame } from '../../../../helpers/utils/confirm-tx.util';

import InfoTooltip from '../../../../components/ui/info-tooltip';
import AdvancedGasControls from '../advanced-gas-controls/advanced-gas-controls.component';

import { I18nContext } from '../../../../contexts/i18n';

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

  return (
    <div className="edit-gas-display">
      <div className="edit-gas-display__content">
        {showTopError && (
          <BannerAlert
            severity={Severity.Danger}
            description={t('insufficientFunds')}
            marginBottom={6}
          />
        )}
        {warningMessage && (
          <BannerAlert
            severity={Severity.Warning}
            description={warningMessage}
            marginBottom={6}
          />
        )}
        {requireDappAcknowledgement && (
          <BannerAlert
            severity={Severity.Warning}
            className="banner-alert--warning"
            description={t('gasDisplayDappWarning', [transaction.origin])}
            marginBottom={6}
          />
        )}
        {mode === EditGasModes.speedUp && (
          <div className="edit-gas-display__top-tooltip">
            <Text
              color={TextColor.textDefault}
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Bold}
            >
              {t('speedUpTooltipText')}{' '}
              <InfoTooltip
                position="top"
                contentText={t('speedUpExplanation')}
              />
            </Text>
          </div>
        )}
        <Text
          color={TextColor.textDefault}
          variant={TextVariant.headingLg}
          as="h1"
          textAlign={TextAlign.Center}
        >
          {estimatedMinimumNative}
        </Text>
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
