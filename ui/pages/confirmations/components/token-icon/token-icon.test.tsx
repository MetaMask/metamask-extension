import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { useSendTokens } from '../../hooks/send/useSendTokens';
import { TokenIcon } from './token-icon';

jest.mock('../../hooks/send/useSendTokens');

const mockStore = configureStore([]);

const CHAIN_ID_MOCK = '0x1';
const TOKEN_ADDRESS_MOCK = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const TOKEN_SYMBOL_MOCK = 'USDT';
const TOKEN_IMAGE_MOCK = 'https://example.com/token.png';

function renderTokenIcon(props = {}) {
  const store = mockStore({
    metamask: {
      networkConfigurationsByChainId: {
        [CHAIN_ID_MOCK]: {
          name: 'Ethereum Mainnet',
          chainId: CHAIN_ID_MOCK,
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <TokenIcon
        chainId={CHAIN_ID_MOCK}
        tokenAddress={TOKEN_ADDRESS_MOCK}
        {...props}
      />
    </Provider>,
  );
}

describe('TokenIcon', () => {
  const useSendTokensMock = jest.mocked(useSendTokens);

  beforeEach(() => {
    jest.resetAllMocks();

    useSendTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        symbol: TOKEN_SYMBOL_MOCK,
        image: TOKEN_IMAGE_MOCK,
      },
    ]);
  });

  it('renders the token avatar', () => {
    renderTokenIcon();

    expect(screen.getByRole('img', { name: TOKEN_SYMBOL_MOCK })).toBeInTheDocument();
  });

  it('renders the network badge', () => {
    const { container } = renderTokenIcon();

    // The ChainBadge renders a BadgeWrapper containing an AvatarNetwork
    const avatarNetworkImg = container.querySelector('img[alt="Ethereum Mainnet"]');
    expect(avatarNetworkImg).toBeInTheDocument();
  });

  it('finds token image and symbol from send tokens', () => {
    useSendTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        symbol: TOKEN_SYMBOL_MOCK,
        image: TOKEN_IMAGE_MOCK,
      },
    ]);

    renderTokenIcon();

    const avatarToken = screen.getByRole('img', { name: TOKEN_SYMBOL_MOCK });
    expect(avatarToken).toHaveAttribute('src', TOKEN_IMAGE_MOCK);
  });

  it('handles missing token gracefully', () => {
    useSendTokensMock.mockReturnValue([]);

    const { container } = renderTokenIcon();

    // Should still render the badge wrapper even without a matched token
    expect(container.firstChild).toBeInTheDocument();
  });

  it('calls useSendTokens with includeNoBalance option', () => {
    renderTokenIcon();

    expect(useSendTokensMock).toHaveBeenCalledWith({ includeNoBalance: true });
  });
});
