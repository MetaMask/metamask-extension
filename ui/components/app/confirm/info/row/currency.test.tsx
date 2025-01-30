import React from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';

import { ConfirmInfoRowCurrency } from './currency';

// TODO: Replace `any` with type
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
});
