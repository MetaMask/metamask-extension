import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import configureStore from '../../store/store';
import {
  setPendingTokens,
  clearPendingTokens,
  getTokenStandardAndDetails,
} from '../../store/actions';
import ImportToken from './import-token.container';

jest.mock('../../store/actions', () => ({
  getTokenStandardAndDetails: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ standard: 'ERC20' })),
  setPendingTokens: jest
    .fn()
    .mockImplementation(() => ({ type: 'SET_PENDING_TOKENS' })),
  clearPendingTokens: jest
    .fn()
    .mockImplementation(() => ({ type: 'CLEAR_PENDING_TOKENS' })),
}));

describe('Import Token', () => {
  const historyStub = jest.fn();
  const props = {
    history: {
      push: historyStub,
    },
    showSearchTab: true,
    tokenList: {},
  };

  const render = () => {
    const baseStore = {
      metamask: {
        tokens: [],
        provider: { chainId: '0x1' },
        frequentRpcListDetail: [],
        identities: {},
        selectedAddress: '0x1231231',
      },
      history: {
        mostRecentOverviewPage: '/',
      },
    };

    const store = configureStore(baseStore);

    return renderWithProvider(<ImportToken {...props} />, store);
  };

  describe('Import Token', () => {
    it('add Custom Token button is disabled when no fields are populated', () => {
      const { getByText } = render();
      const customTokenButton = getByText('Custom Token');
      fireEvent.click(customTokenButton);
      const submit = getByText('Add Custom Token');

      expect(submit).toBeDisabled();
    });

    it('edits token address', () => {
      const { getByText } = render();
      const customTokenButton = getByText('Custom Token');
      fireEvent.click(customTokenButton);

      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      const event = { target: { value: tokenAddress } };
      fireEvent.change(document.getElementById('custom-address'), event);

      expect(document.getElementById('custom-address').value).toStrictEqual(
        tokenAddress,
      );
    });

    it('edits token symbol', () => {
      const { getByText } = render();
      const customTokenButton = getByText('Custom Token');
      fireEvent.click(customTokenButton);

      const tokenSymbol = 'META';
      const event = { target: { value: tokenSymbol } };
      fireEvent.change(document.getElementById('custom-symbol'), event);

      expect(document.getElementById('custom-symbol').value).toStrictEqual(
        tokenSymbol,
      );
    });

    it('edits token decimal precision', () => {
      const { getByText } = render();
      const customTokenButton = getByText('Custom Token');
      fireEvent.click(customTokenButton);

      const tokenPrecision = '2';
      const event = { target: { value: tokenPrecision } };
      fireEvent.change(document.getElementById('custom-decimals'), event);

      expect(document.getElementById('custom-decimals').value).toStrictEqual(
        tokenPrecision,
      );
    });

    it('adds custom tokens successfully', async () => {
      const { getByText } = render();
      const customTokenButton = getByText('Custom Token');
      fireEvent.click(customTokenButton);

      const submit = getByText('Add Custom Token');
      expect(submit).toBeDisabled();

      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      fireEvent.change(document.getElementById('custom-address'), {
        target: { value: tokenAddress },
      });
      expect(submit).not.toBeDisabled();

      const tokenSymbol = 'META';
      fireEvent.change(document.getElementById('custom-symbol'), {
        target: { value: tokenSymbol },
      });

      const tokenPrecision = '2';
      await fireEvent.change(document.getElementById('custom-decimals'), {
        target: { value: tokenPrecision },
      });

      expect(submit).not.toBeDisabled();
      fireEvent.click(submit);
      expect(setPendingTokens).toHaveBeenCalledWith({
        customToken: {
          address: tokenAddress,
          decimals: Number(tokenPrecision),
          standard: 'ERC20',
          symbol: tokenSymbol,
        },
        selectedTokens: {},
        tokenAddressList: [],
      });
      expect(historyStub).toHaveBeenCalledWith('/confirm-import-token');
    });

    it('cancels out of import token flow', () => {
      const { getByRole } = render();
      const closeButton = getByRole('button', { name: 'close' });
      fireEvent.click(closeButton);

      expect(clearPendingTokens).toHaveBeenCalled();
      expect(historyStub).toHaveBeenCalledWith('/');
    });

    it('sets and error when a token is an NFT', async () => {
      process.env.COLLECTIBLES_V1 = true;
      getTokenStandardAndDetails.mockImplementation(() =>
        Promise.resolve({ standard: 'ERC721' }),
      );

      const { getByText } = render();
      const customTokenButton = getByText('Custom Token');
      fireEvent.click(customTokenButton);

      const submit = getByText('Add Custom Token');
      expect(submit).toBeDisabled();

      const tokenAddress = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
      await fireEvent.change(document.getElementById('custom-address'), {
        target: { value: tokenAddress },
      });

      expect(submit).toBeDisabled();

      // The last part of this error message won't be found by getByText because it is wrapped as a link.
      const errorMessage = getByText('This token is an NFT. Add on the');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
