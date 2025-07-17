import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

import { I18nContext, LegacyI18nProvider } from '../../ui/contexts/i18n';
import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import * as en from '../../app/_locales/en/messages.json';
import {
  LegacyMetaMetricsProvider,
  MetaMetricsContext,
} from '../../ui/contexts/metametrics';

// Mock MetaMetrics context for tests
const createMockTrackEvent = () => {
  const mockTrackEvent = jest.fn().mockResolvedValue();
  Object.assign(mockTrackEvent, {
    bufferedTrace: jest.fn().mockResolvedValue(),
    bufferedEndTrace: jest.fn().mockResolvedValue(),
    onboardingParentContext: { current: null },
  });
  return mockTrackEvent;
};

export const I18nProvider = (props) => {
  const { currentLocale, current, en: eng } = props;

  const t = useMemo(() => {
    return (key, ...args) =>
      getMessage(currentLocale, current, key, ...args) ||
      getMessage(currentLocale, eng, key, ...args);
  }, [currentLocale, current, eng]);

  return (
    <I18nContext.Provider value={t}>{props.children}</I18nContext.Provider>
  );
};

I18nProvider.propTypes = {
  currentLocale: PropTypes.string,
  current: PropTypes.object,
  en: PropTypes.object,
  children: PropTypes.node,
};

I18nProvider.defaultProps = {
  children: undefined,
};

export function renderWithProvider(component, store, initialEntries) {
  const mockTrackEvent = createMockTrackEvent();

  const Wrapper = ({ children }) => {
    const WithoutStore = () => (
      <MemoryRouter initialEntries={initialEntries || ['/']} initialIndex={0}>
        <I18nProvider currentLocale="en" current={en} en={en}>
          <LegacyI18nProvider>
            <MetaMetricsContext.Provider value={mockTrackEvent}>
              <LegacyMetaMetricsProvider>{children}</LegacyMetaMetricsProvider>
            </MetaMetricsContext.Provider>
          </LegacyI18nProvider>
        </I18nProvider>
      </MemoryRouter>
    );
    return store ? (
      <Provider store={store}>
        <WithoutStore></WithoutStore>
      </Provider>
    ) : (
      <WithoutStore></WithoutStore>
    );
  };

  Wrapper.propTypes = {
    children: PropTypes.node,
  };

  return render(component, { wrapper: Wrapper });
}
