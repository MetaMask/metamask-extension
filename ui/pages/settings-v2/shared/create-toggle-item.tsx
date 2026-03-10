import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Json } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SettingsToggleItem } from '../../settings/settings-toggle-item';
import type { MetaMaskReduxState } from '../../../store/store';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  type MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

const selectAlwaysFalse = (): boolean => false;

export type ToggleEventConfig = {
  event: MetaMetricsEventName;
  properties: (newValue: boolean) => Record<string, Json>;
};

export type ToggleItemConfig = {
  name: string;
  titleKey: string;
  descriptionKey: string;
  selector: (state: MetaMaskReduxState) => boolean;
  action: (value: boolean) => unknown;
  dataTestId: string;
  disabledSelector?: (state: MetaMaskReduxState) => boolean;
  trackEvent?: ToggleEventConfig;
};

/**
 * Factory function to create a simple toggle settings item component.
 * @param config
 */
export const createToggleItem = (config: ToggleItemConfig): React.FC => {
  const ToggleItem = () => {
    const t = useI18nContext();
    const dispatch = useDispatch();
    const { trackEvent } = useContext(MetaMetricsContext);
    const value = useSelector(config.selector);
    const disabled = useSelector(config.disabledSelector ?? selectAlwaysFalse);

    const handleToggle = (currentValue: boolean) => {
      const newValue = !currentValue;
      dispatch(config.action(newValue));

      if (config.trackEvent) {
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: config.trackEvent.event,
          properties: config.trackEvent.properties(newValue),
        });
      }
    };

    return (
      <SettingsToggleItem
        title={t(config.titleKey)}
        description={t(config.descriptionKey)}
        value={value}
        onToggle={handleToggle}
        dataTestId={config.dataTestId}
        disabled={disabled}
      />
    );
  };

  ToggleItem.displayName = config.name;
  return ToggleItem;
};
