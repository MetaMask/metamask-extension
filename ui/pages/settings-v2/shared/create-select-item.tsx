import React, { type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MetaMaskReduxState } from '../../../store/store';
import { SettingsSelectItem } from './settings-select-item';

type TranslateFunction = ReturnType<typeof useI18nContext>;

export type SelectItemConfig = {
  name: string;
  titleKey: string;
  valueSelector: (state: MetaMaskReduxState) => string;
  /** Optional formatter to transform the value. Receives translation function for i18n. */
  formatValue?: (value: string, t: TranslateFunction) => string | ReactNode;
  route: string;
};

/**
 * Factory function to create a simple select settings item component.
 * @param config
 */
export const createSelectItem = (config: SelectItemConfig): React.FC => {
  const SelectItem = () => {
    const t = useI18nContext();
    const value = useSelector(config.valueSelector);

    const displayValue = config.formatValue
      ? config.formatValue(value, t)
      : value;

    return (
      <SettingsSelectItem
        label={t(config.titleKey)}
        value={displayValue}
        to={config.route}
      />
    );
  };

  SelectItem.displayName = config.name;
  return SelectItem;
};
