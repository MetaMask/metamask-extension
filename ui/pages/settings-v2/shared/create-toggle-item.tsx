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

/** Translate function signature for custom description renderers */
export type ToggleItemDescriptionRenderer = (
  t: (key: string, ...args: unknown[]) => React.ReactNode,
) => React.ReactNode;

export type ToggleItemConfig = {
  name: string;
  titleKey: string;
  /** Simple i18n key for description (plain text). */
  descriptionKey?: string;
  /** Custom description with links etc. When set, takes precedence over descriptionKey. */
  description?: ToggleItemDescriptionRenderer;
  selector: (state: MetaMaskReduxState) => boolean;
  action: (value: boolean) => unknown;
  dataTestId: string;
  /** Wrapper element test id (e.g. for the row container). */
  containerDataTestId?: string;
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

    let descriptionContent: React.ReactNode;
    if (config.description) {
      descriptionContent = config.description(
        t as (...args: unknown[]) => React.ReactNode,
      );
    } else if (config.descriptionKey) {
      descriptionContent = t(config.descriptionKey);
    } else {
      descriptionContent = undefined;
    }

    return (
      <SettingsToggleItem
        title={t(config.titleKey)}
        description={descriptionContent}
        value={value}
        onToggle={handleToggle}
        containerDataTestId={config.containerDataTestId}
        dataTestId={config.dataTestId}
        disabled={disabled}
      />
    );
  };

  ToggleItem.displayName = config.name;
  return ToggleItem;
};
