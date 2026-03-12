import React from 'react';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../shared/constants/smartTransactions';
import { setSmartTransactionsPreferenceEnabled } from '../../../store/actions';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/modules/selectors';
import {
  createToggleItem,
  type ToggleItemDescriptionRenderer,
} from '../shared/create-toggle-item';

const description: ToggleItemDescriptionRenderer = (t) =>
  t('stxOptInSupportedNetworksDescription', [
    <a
      key="learn_more"
      href={SMART_TRANSACTIONS_LEARN_MORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary-default"
    >
      {t('learnMoreUpperCase')}
    </a>,
  ]);

export const SmartTransactionsItem = createToggleItem({
  name: 'SmartTransactionsItem',
  titleKey: 'smartTransactions',
  description,
  selector: getSmartTransactionsPreferenceEnabled,
  action: setSmartTransactionsPreferenceEnabled,
  dataTestId: 'settings-page-stx-opt-in-toggle',
  containerDataTestId: 'advanced-setting-enable-smart-transactions',
});
