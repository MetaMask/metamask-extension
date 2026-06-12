import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import type { Hex } from '@metamask/utils';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { useSendTokens } from '../../hooks/send/useSendTokens';
import { TokenIcon } from './token-icon';

jest.mock('../../hooks/send/useSendTokens');

const mockStore = configureStore([]);

const CHAIN_ID_MOCK = '0x1';
const TOKEN_ADDRESS_MOCK = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const TOKEN_SYMBOL_MOCK = 'USDT';
const TOKEN_IMAGE_MOCK = 'https://example.com/token.png';
const MISSING_ADDRESS_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const SUPPORTED_CHAIN_ICON_CASES: [string, Hex, string][] = [
  ['mainnet', '0x1', '1'],
  ['Linea', '0xe708', '59144'],
  ['BSC', '0x38', '56'],
];

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
    const { container } = renderTokenIcon();

    expect(container.querySelector('.mm-avatar-token')).toBeInTheDocument();
  });

  it('renders the network badge', () => {
    const { container } = renderTokenIcon();

    expect(container.querySelector('.mm-avatar-network')).toBeInTheDocument();
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

    const { container } = renderTokenIcon();

    const avatarToken = container.querySelector('.mm-avatar-token img');
    expect(avatarToken).toHaveAttribute('src', TOKEN_IMAGE_MOCK);
  });

  it('handles missing token gracefully', () => {
    useSendTokensMock.mockReturnValue([]);

    const { container } = renderTokenIcon();

    expect(container.querySelector('.mm-avatar-token')).toBeInTheDocument();
  });

  it('calls useSendTokens with includeNoBalance option', () => {
    renderTokenIcon();

    expect(useSendTokensMock).toHaveBeenCalledWith({ includeNoBalance: true });
  });

  it('renders the token icon URL fallback when token metadata is missing', () => {
    useSendTokensMock.mockReturnValue([]);

    const { container } = renderTokenIcon({
      tokenAddress: MISSING_ADDRESS_MOCK,
      symbol: 'ABC',
    });

    const img = container.querySelector('.mm-avatar-token img');
    expect(img).toHaveAttribute(
      'src',
      `https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/${MISSING_ADDRESS_MOCK}.png`,
    );
    expect(img).toHaveAttribute('alt', 'ABC logo');
  });

  it('falls back to the token icon URL when the matched token image is empty', () => {
    useSendTokensMock.mockReturnValue([
      {
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        symbol: TOKEN_SYMBOL_MOCK,
        image: '',
      },
    ]);

    const { container } = renderTokenIcon();

    expect(container.querySelector('.mm-avatar-token img')).toHaveAttribute(
      'src',
      `https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/${TOKEN_ADDRESS_MOCK}.png`,
    );
  });

  SUPPORTED_CHAIN_ICON_CASES.forEach(
    ([networkName, chainId, decimalChainId]) => {
      it(`renders the token icon URL fallback for ${networkName} when token metadata is missing`, () => {
        useSendTokensMock.mockReturnValue([]);

        const { container } = renderTokenIcon({
          chainId,
          tokenAddress: MISSING_ADDRESS_MOCK,
          symbol: 'ABC',
        });

        expect(container.querySelector('.mm-avatar-token img')).toHaveAttribute(
          'src',
          `https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/${decimalChainId}/erc20/${MISSING_ADDRESS_MOCK}.png`,
        );
      });
    },
  );

  it('does not use the URL fallback for the native token address', () => {
    useSendTokensMock.mockReturnValue([]);

    const { container } = renderTokenIcon({
      tokenAddress: getNativeTokenAddress(CHAIN_ID_MOCK),
      symbol: 'ETH',
    });

    expect(container.querySelector('.mm-avatar-token img')).toBeNull();
    expect(container.querySelector('.mm-avatar-token')).toHaveTextContent('E');
  });
});
