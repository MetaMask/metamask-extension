import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { PayWithSection } from './pay-with-section';
import type { PayWithSectionConfig } from './pay-with-modal.types';

const renderSection = (config: PayWithSectionConfig) =>
  renderWithProvider(
    <PayWithSection config={config} />,
    configureStore(mockState),
  );

describe('PayWithSection', () => {
  it('renders the section title and rows', () => {
    const onPress = jest.fn();

    renderSection({
      id: 'crypto',
      title: 'Crypto',
      testId: 'pay-with-section-crypto',
      rows: [
        {
          id: 'other-assets',
          icon: <span />,
          title: 'Other assets',
          subtitle: 'Select from your tokens',
          trailingElement: 'chevron',
          onPress,
          testId: 'other-assets-row',
        },
      ],
    });

    expect(screen.getByTestId('pay-with-section-crypto')).toBeInTheDocument();
    expect(
      screen.getByTestId('pay-with-section-crypto-title'),
    ).toHaveTextContent('Crypto');
    expect(screen.getByTestId('other-assets-row')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('other-assets-row'));
    expect(onPress).toHaveBeenCalled();
  });

  it('omits the title when empty and derives a default test id', () => {
    renderSection({
      id: 'money-account',
      title: '',
      rows: [
        {
          id: 'money',
          icon: <span />,
          title: 'Money account',
          testId: 'money-row',
        },
      ],
    });

    expect(
      screen.getByTestId('pay-with-section-money-account'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('pay-with-section-money-account-title'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('money-row')).toBeInTheDocument();
  });
});
