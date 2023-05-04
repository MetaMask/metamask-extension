import React from 'react';
import configureMockStore from 'redux-mock-store';

import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MultichainTokenListItem } from './multichain-token-list-item';

const state = {
  metamask: {
    providerConfig: {
      ticker: 'ETH',
      nickname: '',
      chainId: '0x1',
      type: 'mainnet',
    },
    useTokenDetection: false,
    nativeCurrency: 'ETH',
  },
};

describe('MultichainTokenListItem', () => {
  const props = {
    onClick: jest.fn(),
  };
  it('should render correctly', () => {
    const store = configureMockStore()(state);
    const { getByTestId, container } = renderWithProvider(
      <MultichainTokenListItem />,
      store,
    );
    expect(getByTestId('multichain-token-list-item')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render with custom className', () => {
    const store = configureMockStore()(state);
    const { getByTestId } = renderWithProvider(
      <MultichainTokenListItem className="multichain-token-list-item-test" />,
      store,
    );
    expect(getByTestId('multichain-token-list-item')).toHaveClass(
      'multichain-token-list-item-test',
    );
  });

  it('handles click action and fires onClick', () => {
    const store = configureMockStore()(state);
    const { queryByTestId } = renderWithProvider(
      <MultichainTokenListItem {...props} />,
      store,
    );

    fireEvent.click(queryByTestId('multichain-token-list-button'));

    expect(props.onClick).toHaveBeenCalled();
  });
});
