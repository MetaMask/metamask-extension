import React from 'react';
import { useSelector } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { generateUseSelectorRouter } from '../../../hooks/gasFeeInput/test-utils';
import { renderWithProvider } from '../../../../test/jest/rendering';
import TokenOverview from './token-overview';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

describe('TokenOverview', () => {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  beforeAll(() => {
    useSelector.mockImplementation(generateUseSelectorRouter());
  });
  afterEach(() => {
    store.clearActions();
  });

  describe('TokenOverview', () => {
    it('should not show a modal when token passed in props is not an ERC721', () => {
      const token = {
        name: 'test',
        isERC721: false,
        address: '0x01',
        symbol: 'test',
      };
      renderWithProvider(<TokenOverview token={token} />, store);

      const actions = store.getActions();
      expect(actions).toHaveLength(0);
    });

    it('should show ConvertTokenToNFT modal when token passed in props is an ERC721', () => {
      const token = {
        name: 'test',
        isERC721: true,
        address: '0x01',
        symbol: 'test',
      };
      renderWithProvider(<TokenOverview token={token} />, store);

      const actions = store.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('UI_MODAL_OPEN');
      expect(actions[0].payload).toStrictEqual({
        name: 'CONVERT_TOKEN_TO_NFT',
        tokenAddress: '0x01',
      });
    });
  });
});
