import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import CurrencyDisplay from '.';

describe('CurrencyDisplay Component', () => {
  const mockStore = configureMockStore()(mockState);

  it('should match default snapshot', () => {
    const { container } = renderWithProvider(<CurrencyDisplay />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should render text with a className', () => {
    const props = {
      displayValue: '$123.45',
      className: 'currency-display',
      hideLabel: true,
    };

    const { container } = renderWithProvider(
      <CurrencyDisplay {...props} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render without title (tooltip)', () => {
    const props = {
      displayValue: '$123.45',
      privacyMode: true,
    };

    const { container } = renderWithProvider(
      <CurrencyDisplay {...props} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with title (tooltip)', () => {
    const props = {
      displayValue: '$123.45',
      privacyMode: false,
    };

    const { container } = renderWithProvider(
      <CurrencyDisplay {...props} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render text with a prefix', () => {
    const props = {
      displayValue: '$123.45',
      className: 'currency-display',
      prefix: '-',
      hideLabel: true,
    };

    const { container } = renderWithProvider(
      <CurrencyDisplay {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render with chainId prop', () => {
    const props = {
      value: '0x16345785d8a0000',
      currency: 'POL',
      chainId: '0x89',
    };

    const { container, getByText } = renderWithProvider(
      <CurrencyDisplay {...props} />,
      mockStore,
    );

    expect(
      container.querySelector('.currency-display-component'),
    ).toBeInTheDocument();
    expect(getByText(/0.1/u)).toBeInTheDocument();
    expect(getByText(/POL/u)).toBeInTheDocument();
  });
});
