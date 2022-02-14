import React from 'react';
import reactRouterDom from 'react-router-dom';
import { fireEvent, screen } from '@testing-library/react';
import {
  ASSET_ROUTE,
  IMPORT_TOKEN_ROUTE,
} from '../../helpers/constants/routes';
import { addTokens, clearPendingTokens } from '../../store/actions';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/jest';
import ConfirmImportToken from '.';

const MOCK_PENDING_TOKENS = {
  '0x6b175474e89094c44da98b954eedeac495271d0f': {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    symbol: 'META',
    decimals: 18,
    image: 'metamark.svg',
  },
  '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': {
    address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
    symbol: '0X',
    decimals: 18,
    image: '0x.svg',
  },
};

jest.mock('../../store/actions', () => ({
  addTokens: jest.fn().mockReturnValue({ type: 'test' }),
  clearPendingTokens: jest
    .fn()
    .mockReturnValue({ type: 'CLEAR_PENDING_TOKENS' }),
}));

const renderComponent = (mockPendingTokens = MOCK_PENDING_TOKENS) => {
  const store = configureStore({
    metamask: {
      pendingTokens: { ...mockPendingTokens },
      provider: { chainId: '0x1' },
    },
    history: {
      mostRecentOverviewPage: '/',
    },
  });

  return renderWithProvider(<ConfirmImportToken />, store);
};

describe('ConfirmImportToken Component', () => {
  const mockHistoryPush = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: mockHistoryPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render', () => {
    renderComponent();

    const [title, importTokensBtn] = screen.queryAllByText('Import Tokens');

    expect(title).toBeInTheDocument(title);
    expect(
      screen.getByText('Would you like to import these tokens?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(importTokensBtn).toBeInTheDocument();
  });

  it('should render the list of tokens', () => {
    renderComponent();

    Object.values(MOCK_PENDING_TOKENS).forEach((token) => {
      expect(screen.getByText(token.symbol)).toBeInTheDocument();
    });
  });

  it('should go to "IMPORT_TOKEN_ROUTE" route when clicking the "Back" button', async () => {
    renderComponent();

    const backBtn = screen.getByRole('button', { name: 'Back' });

    await fireEvent.click(backBtn);
    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(IMPORT_TOKEN_ROUTE);
  });

  it('should dispatch clearPendingTokens and redirect to the first token page when clicking the "Import Tokens" button', async () => {
    const mockFirstPendingTokenAddress =
      '0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1';
    const mockPendingTokens = {
      [mockFirstPendingTokenAddress]: {
        address: mockFirstPendingTokenAddress,
        symbol: 'CVL',
        decimals: 18,
        image: 'CVL_token.svg',
      },
      '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': {
        address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
        symbol: 'GLA',
        decimals: 18,
        image: 'gladius.svg',
      },
    };
    renderComponent(mockPendingTokens);

    const importTokensBtn = screen.getByRole('button', {
      name: 'Import Tokens',
    });

    await fireEvent.click(importTokensBtn);

    expect(addTokens).toHaveBeenCalled();
    expect(clearPendingTokens).toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      `${ASSET_ROUTE}/${mockFirstPendingTokenAddress}`,
    );
  });
});
