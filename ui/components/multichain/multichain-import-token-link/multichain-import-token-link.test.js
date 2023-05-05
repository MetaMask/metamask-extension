import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import { detectNewTokens } from '../../../store/actions';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MultichainImportTokenLink } from './multichain-import-token-link';

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
  detectNewTokens: jest.fn(),
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

    const { container } = renderWithProvider(
      <MultichainImportTokenLink />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for mainnet chainId', () => {
    const mockState = {
      metamask: {
        providerConfig: {
          chainId: '0x1',
        },
      },
    };

    const store = configureMockStore()(mockState);

    const { container } = renderWithProvider(
      <MultichainImportTokenLink />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should detectNewTokens when clicking refresh', () => {
    const mockState = {
      metamask: {
        providerConfig: {
          chainId: '0x5',
        },
      },
    };

    const store = configureMockStore()(mockState);

    renderWithProvider(<MultichainImportTokenLink />, store);

    const refreshList = screen.getByTestId('refresh-list-button');
    fireEvent.click(refreshList);

    expect(detectNewTokens).toHaveBeenCalled();
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

    renderWithProvider(<MultichainImportTokenLink />, store);

    const importToken = screen.getByTestId('import-token-button');
    fireEvent.click(importToken);

    expect(mockPushHistory).toHaveBeenCalledWith('/import-token');
  });
});
