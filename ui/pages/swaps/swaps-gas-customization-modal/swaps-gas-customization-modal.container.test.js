import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import GasCustomizationModalContainer from '.';

describe('GasCustomizationModalContainer', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <GasCustomizationModalContainer />,
      store,
    );
    expect(document.querySelector('.page-container__header')).toMatchSnapshot();
    expect(getByText('Basic')).toBeInTheDocument();
    expect(getByText('Advanced')).toBeInTheDocument();
    expect(getByText('Estimated Processing Times')).toBeInTheDocument();
    expect(getByText('Send Amount')).toBeInTheDocument();
    expect(getByText('Transaction Fee')).toBeInTheDocument();
    expect(
      document.querySelector('.gas-modal-content__info-row__send-info'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.gas-modal-content__info-row__transaction-info'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.gas-modal-content__info-row__total-info'),
    ).toMatchSnapshot();
    expect(document.querySelector('.page-container__footer')).toMatchSnapshot();
  });
});
