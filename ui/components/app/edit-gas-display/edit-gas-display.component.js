import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';

import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

import InfoTooltip from '../../ui/info-tooltip';
import TransactionTotalBanner from '../transaction-total-banner/transaction-total-banner.component';
import RadioGroup from '../../ui/radio-group/radio-group.component';
import AdvancedGasControls from '../advanced-gas-controls/advanced-gas-controls.component';

import { I18nContext } from '../../../contexts/i18n';
import ActionableMessage from '../../ui/actionable-message/actionable-message';

export default function EditGasDisplay({
  alwaysShowForm,
  type,
  showEducationButton,
  onEducationClick,
  dappSuggestedGasFee,
  dappOrigin,
}) {
  const t = useContext(I18nContext);

  const [warning] = useState(null);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [
    dappSuggestedGasFeeAcknowledged,
    setDappSuggestedGasFeeAcknowledged,
  ] = useState(false);

  const requireDappAcknowledgement =
    dappSuggestedGasFee && !dappSuggestedGasFeeAcknowledged;

  return (
    <div className="edit-gas-display">
      <div className="edit-gas-display__content">
        {warning && (
          <div className="edit-gas-display__warning">
            <ActionableMessage
              className="actionable-message--warning"
              message="Swaps are time sensitive. “Medium” is not reccomended."
            />
          </div>
        )}
        {requireDappAcknowledgement && (
          <div className="edit-gas-display__dapp-acknowledgement-warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={t('gasDisplayDappWarning', [dappOrigin])}
              useIcon
            />
          </div>
        )}
        {type === 'speed-up' && (
          <div className="edit-gas-display__top-tooltip">
            <Typography
              color={COLORS.BLACK}
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

        <TransactionTotalBanner total="" detail="" timing="" />

        {requireDappAcknowledgement && (
          <Button
            className="edit-gas-display__dapp-acknowledgement-button"
            onClick={() => setDappSuggestedGasFeeAcknowledged(true)}
          >
            {t('gasDisplayAcknowledgeDappButtonText')}
          </Button>
        )}

        {!requireDappAcknowledgement && (
          <RadioGroup
            name="gas-recommendation"
            options={[
              { value: 'low', label: t('editGasLow'), recommended: false },
              {
                value: 'medium',
                label: t('editGasMedium'),
                recommended: false,
              },
              { value: 'high', label: t('editGasHigh'), recommended: true },
            ]}
            selectedValue="high"
          />
        )}
        {!requireDappAcknowledgement && !alwaysShowForm && (
          <button
            className="edit-gas-display__advanced-button"
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
          >
            {t('advancedOptions')}{' '}
            {showAdvancedForm ? (
              <i className="fa fa-caret-up"></i>
            ) : (
              <i className="fa fa-caret-down"></i>
            )}
          </button>
        )}
        {((!requireDappAcknowledgement && alwaysShowForm) ||
          showAdvancedForm) && <AdvancedGasControls />}
      </div>
      {!requireDappAcknowledgement && showEducationButton && (
        <div className="edit-gas-display__education">
          <button onClick={onEducationClick}>
            {t('editGasEducationButtonText')}
          </button>
        </div>
      )}
    </div>
  );
}

EditGasDisplay.propTypes = {
  alwaysShowForm: PropTypes.bool,
  type: PropTypes.oneOf(['customize-gas', 'speed-up']),
  showEducationButton: PropTypes.bool,
  onEducationClick: PropTypes.func,
  dappSuggestedGasFee: PropTypes.number,
  dappOrigin: PropTypes.string,
};

EditGasDisplay.defaultProps = {
  alwaysShowForm: false,
  type: 'customize-gas',
  showEducationButton: false,
  onEducationClick: undefined,
  dappSuggestedGasFee: 0,
  dappOrigin: '',
};
