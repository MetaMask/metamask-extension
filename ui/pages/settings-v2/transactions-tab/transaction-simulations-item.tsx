import React from 'react';
import { TRANSACTION_SIMULATIONS_LEARN_MORE_LINK } from '../../../../shared/lib/ui-utils';
import { setUseTransactionSimulations } from '../../../store/actions';
import { getIsActiveShieldSubscription } from '../../../selectors/subscription';
import type { MetaMaskReduxState } from '../../../store/store';
import {
  createToggleItem,
  type ToggleItemConfig,
} from '../shared/create-toggle-item';

const selectIsDisabledByShieldSubscription = (state: MetaMaskReduxState) =>
  getIsActiveShieldSubscription(
    state as unknown as Parameters<typeof getIsActiveShieldSubscription>[0],
  );

const description: ToggleItemConfig['description'] = (t) =>
  t('simulationsSettingDescription', [
    <a
      key="learn_more_link"
      href={TRANSACTION_SIMULATIONS_LEARN_MORE_LINK}
      rel="noopener noreferrer"
      target="_blank"
      className="font-medium text-primary-default"
    >
      {t('learnMoreUpperCase')}
    </a>,
  ]);

export const TransactionSimulationsItem = createToggleItem({
  name: 'TransactionSimulationsItem',
  titleKey: 'simulationsSettingSubHeader',
  description,
  selector: (state: MetaMaskReduxState) =>
    Boolean(state.metamask?.useTransactionSimulations),
  action: setUseTransactionSimulations,
  dataTestId: 'useTransactionSimulations-toggle',
  disabledSelector: selectIsDisabledByShieldSubscription,
});
