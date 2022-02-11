import React from 'react';
import reactRouterDom from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, screen } from '@testing-library/react';
import {
  ASSET_ROUTE,
  IMPORT_TOKEN_ROUTE,
} from '../../helpers/constants/routes';
import { addTokens, clearPendingTokens } from '../../store/actions';
import { renderWithProvider } from '../../../test/jest/rendering';
import mockState from '../../../test/data/mock-state.json';
import ConfirmImportToken from '.';

const MOCK_PENDING_TOKENS = mockState.metamask.tokens.reduce(
  (result, token) => {
    result[token.address] = { ...token, decimals: 18 };
    return result;
  },
  {},
);

jest.mock('../../store/actions', () => ({
  addTokens: jest.fn().mockReturnValue({ type: 'test' }),
  clearPendingTokens: jest
    .fn()
    .mockReturnValue({ type: 'CLEAR_PENDING_TOKENS' }),
}));

const renderComponent = () => {
  const baseStore = {
    metamask: {
      ...mockState.metamask,
      pendingTokens: { ...MOCK_PENDING_TOKENS },
    },
    history: {
      mostRecentOverviewPage: '/',
    },
  };
  const store = configureMockStore([thunk])(baseStore);
  return renderWithProvider(<ConfirmImportToken />, store);
};

describe('ConfirmImportToken Component', () => {
  const mockHistoryPush = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: mockHistoryPush });

    renderComponent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render', () => {
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
    Object.values(MOCK_PENDING_TOKENS).forEach((token) => {
      console.log(token);
      expect(screen.getByText(token.symbol)).toBeInTheDocument();
    });
  });

  it('should go to "IMPORT_TOKEN_ROUTE" route when clicking the "Back" button', async () => {
    const backBtn = screen.getByRole('button', { name: 'Back' });

    await fireEvent.click(backBtn);
    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(IMPORT_TOKEN_ROUTE);
  });

  it('should dispatch clearPendingTokens when clicking the "Import Tokens" button', async () => {
    const importTokensBtn = screen.getByRole('button', {
      name: 'Import Tokens',
    });
    const mockFirstTokenAddress = Object.values(MOCK_PENDING_TOKENS)[0].address;

    await fireEvent.click(importTokensBtn);

    expect(addTokens).toHaveBeenCalled();
    expect(clearPendingTokens).toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      `${ASSET_ROUTE}/${mockFirstTokenAddress}`,
    );
  });
});
