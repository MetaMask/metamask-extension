import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';

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

export default function EditGasDisplay({ alwaysShowForm, type }) {
  const t = useContext(I18nContext);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);

  return (
    <div className="edit-gas-display">
      {type === 'speed-up' && (
        <div className="edit-gas-display__top-tooltip">
          <Typography
            color={COLORS.BLACK}
            variant={TYPOGRAPHY.H8}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            New gas fee{' '}
            <InfoTooltip position="top" contentText={t('speedUpExplanation')} />
          </Typography>
        </div>
      )}
      <TransactionTotalBanner
        total="9.99"
        detail="Up to $17.79 (0.01234 ETH)"
        timing="Likely in < 30 seconds
"
      />
      <RadioGroup
        name="gas-recommendation"
        options={[
          { value: 'low', label: 'Low', recommended: false },
          { value: 'medium', label: 'Medium', recommended: false },
          { value: 'high', label: 'High', recommended: true },
        ]}
        selectedValue="high"
      />
      {!alwaysShowForm && (
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
      {(alwaysShowForm || showAdvancedForm) && <AdvancedGasControls />}
    </div>
  );
}

EditGasDisplay.propTypes = {
  alwaysShowForm: PropTypes.bool,
  type: PropTypes.oneOf(['customize-gas', 'speed-up']),
};

EditGasDisplay.defaultProps = {
  alwaysShowForm: false,
  type: 'customize-gas',
};
