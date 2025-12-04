import React from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';

import { ConfirmInfoRowCurrency } from './currency';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const render = (props: Record<string, any> = {}) => {
  const { metamask } = mockState;
  const store = configureStore({
    metamask,
  });

  return renderWithProvider(
    <ConfirmInfoRowCurrency value={0xbefe6f672000} {...props} />,
    store,
  );
};

describe('ConfirmInfoRowCurrency', () => {
  it('should display value in user preferred currency by default', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('should display in currency passed', () => {
    const { container } = render({ currency: 'usd' });
    expect(container).toMatchSnapshot();
  });

  it('should display with chainId prop', () => {
    const { container, getByText } = render({
      currency: 'POL',
      chainId: '0x89',
    });
    expect(
      container.querySelector('.currency-display-component'),
    ).toBeInTheDocument();
    expect(getByText(/0.148619/u)).toBeInTheDocument();
    expect(getByText(/POL/u)).toBeInTheDocument();
  });
});
