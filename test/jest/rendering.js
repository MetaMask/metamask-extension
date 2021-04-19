import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LegacyI18nProvider } from '../../ui/app/contexts/i18n';

export function renderWithProvider(component, store) {
  const Wrapper = () =>
    store ? (
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']} initialIndex={0}>
          <LegacyI18nProvider>{component}</LegacyI18nProvider>
        </MemoryRouter>
      </Provider>
    ) : (
      <LegacyI18nProvider>{component}</LegacyI18nProvider>
    );

  return render(<Wrapper />);
}
