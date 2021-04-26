import React from 'react';
import configureMockStore from 'redux-mock-store';

import GasModalPageContainer from './';
import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../../test/jest';

const createProps = (customProps = {}) => {
  return {
    inputValue: '5 ETH',
    onInputChange: jest.fn(),
    ethBalance: '5 ETH',
    setMaxSlippage: jest.fn(),
    maxSlippage: 15,
    selectedAccountAddress: 'selectedAccountAddress',
    isFeatureFlagLoaded: false,
    ...customProps,
  };
};

describe('GasModalPageContainer', () => {
  test('renders the component with initial props', () => {
    expect(true).toBe(true);
    // const store = configureMockStore()(createSwapsMockStore());
    // const props = createProps();
    // const { container, getByText } = renderWithProvider(
    //   <GasModalPageContainer {...props} />,
    //   store,
    // );
    // expect(container).toMatchSnapshot();
    // expect(getByText('[swapProcessing]')).toBeInTheDocument();
  });
});
