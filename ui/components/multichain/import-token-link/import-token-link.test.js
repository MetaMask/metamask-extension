import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import { detectTokens } from '../../../store/actions';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ImportTokenLink } from '.';

const mockPushHistory = jest.fn();

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useLocation: jest.fn(() => ({ search: '' })),
    useHistory: () => ({
      push: mockPushHistory,
    }),
  };
});

jest.mock('../../../store/actions.ts', () => ({
  detectTokens: jest.fn().mockImplementation(() => ({ type: 'DETECT_TOKENS' })),
  showImportTokensModal: jest
    .fn()
    .mockImplementation(() => ({ type: 'UI_IMPORT_TOKENS_POPOVER_OPEN' })),
}));

describe('Import Token Link', () => {
  it('should match snapshot for goerli chainId', () => {
    const mockState = {
      metamask: {
        providerConfig: {
          chainId: '0x5',
        },
      },
    };

    const store = configureMockStore()(mockState);

    const { container } = renderWithProvider(<ImportTokenLink />, store);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for mainnet chainId', () => {
    const mockState = {
      metamask: {
        providerConfig: {
          chainId: CHAIN_IDS.MAINNET,
        },
      },
    };

    const store = configureMockStore()(mockState);

    const { container } = renderWithProvider(<ImportTokenLink />, store);

    expect(container).toMatchSnapshot();
  });

  it('should detectTokens when clicking refresh', () => {
    const mockState = {
      metamask: {
        providerConfig: {
          chainId: '0x5',
        },
      },
    };

    const store = configureMockStore()(mockState);

    renderWithProvider(<ImportTokenLink />, store);

    const refreshList = screen.getByTestId('refresh-list-button');
    fireEvent.click(refreshList);

    expect(detectTokens).toHaveBeenCalled();
  });

  it('should push import token route', () => {
    const mockState = {
      metamask: {
        providerConfig: {
          chainId: '0x5',
        },
      },
    };

    const store = configureMockStore()(mockState);

    renderWithProvider(<ImportTokenLink />, store);

    const importToken = screen.getByTestId('import-token-button');
    fireEvent.click(importToken);

    expect(screen.getByText('Import tokens')).toBeInTheDocument();
  });
});
