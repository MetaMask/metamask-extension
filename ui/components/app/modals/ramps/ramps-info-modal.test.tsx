import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nContext } from '../../../../contexts/i18n';
import RampsInfoModal from './ramps-info-modal';

describe('RampsInfoModal', () => {
  it('renders the given testId, and translates titleKey and bodyKey', () => {
    render(
      <I18nContext.Provider value={(key) => key}>
        <RampsInfoModal
          testId="some-modal"
          titleKey="titleKey"
          bodyKey="bodyKey"
        />
      </I18nContext.Provider>,
    );
    expect(screen.getByTestId('some-modal')).toBeInTheDocument();
    expect(screen.getByText('titleKey')).toBeInTheDocument();
    expect(screen.getByText('bodyKey')).toBeInTheDocument();
  });
});
