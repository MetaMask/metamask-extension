import React, { useState, useContext } from 'react';

import TransactionTotalBanner from '../transaction-total-banner/transaction-total-banner.component';
import RadioGroup from '../../ui/radio-group/radio-group.component';

import AdvancedGasControls from '../advanced-gas-controls/advanced-gas-controls.component';

import { I18nContext } from '../../../contexts/i18n';

export default function EditGasDisplay() {
  const t = useContext(I18nContext);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);

  return (
    <div className="edit-gas-display">
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
      {showAdvancedForm && <AdvancedGasControls />}
    </div>
  );
}
