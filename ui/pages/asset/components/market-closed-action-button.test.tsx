import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nContext } from '../../../contexts/i18n';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { MarketClosedActionButton } from './market-closed-action-button';

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <I18nContext.Provider value={tEn as any}>{component}</I18nContext.Provider>,
  );
};

describe('MarketClosedActionButton', () => {
  it('renders the translated button text', () => {
    renderWithI18n(<MarketClosedActionButton onClick={jest.fn()} />);

    expect(
      screen.getByText(messages.bridgeMarketClosedAction.message),
    ).toBeInTheDocument();
  });

  it('renders with data-testid', () => {
    renderWithI18n(<MarketClosedActionButton onClick={jest.fn()} />);

    expect(
      screen.getByTestId('market-closed-action-button'),
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    renderWithI18n(<MarketClosedActionButton onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('market-closed-action-button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
