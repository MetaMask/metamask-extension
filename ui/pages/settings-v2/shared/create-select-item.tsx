import React, { type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MetaMaskReduxState } from '../../../store/store';
import { SettingsSelectItem } from './settings-select-item';

type TranslateFunction = ReturnType<typeof useI18nContext>;

export type SelectItemConfig = {
  name: string;
  labelKey: string;
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
    const navigate = useNavigate();
    const value = useSelector(config.valueSelector);

    const displayValue = config.formatValue
      ? config.formatValue(value, t)
      : value;

    const handlePress = () => {
      navigate(config.route);
    };

    return (
      <SettingsSelectItem
        label={t(config.labelKey)}
        value={displayValue}
        onPress={handlePress}
      />
    );
  };

  SelectItem.displayName = config.name;
  return SelectItem;
};
