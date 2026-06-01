import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  BATCH_SELL_CHAIN_ID,
  BATCH_SELL_ASSET_IDS,
} from '../../../../test/data/batch-sell/constants';
import {
  BatchSellSelectionProvider,
  useBatchSellSelection,
} from './batch-sell-selection-provider';

const CHAIN_ID = BATCH_SELL_CHAIN_ID;
const ASSET_A = BATCH_SELL_ASSET_IDS.USDC;
const ASSET_B = BATCH_SELL_ASSET_IDS.DAI;

const TestConsumer = () => {
  const {
    selectedNetworkChainId,
    selectedAssetsId,
    setSelectedNetworkChainId,
    setSelectedAssetsId,
  } = useBatchSellSelection();

  return (
    <div>
      <span data-testid="chain-id">{selectedNetworkChainId ?? 'null'}</span>
      <span data-testid="assets">{selectedAssetsId.join(',')}</span>
      <button onClick={() => setSelectedNetworkChainId(CHAIN_ID)}>
        set chain
      </button>
      <button onClick={() => setSelectedNetworkChainId(null)}>
        clear chain
      </button>
      <button onClick={() => setSelectedAssetsId([ASSET_A, ASSET_B])}>
        set assets
      </button>
      <button onClick={() => setSelectedAssetsId([])}>clear assets</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <BatchSellSelectionProvider>
      <TestConsumer />
    </BatchSellSelectionProvider>,
  );

describe('BatchSellSelectionProvider', () => {
  describe('initial state', () => {
    it('exposes selectedNetworkChainId as null', () => {
      renderWithProvider();

      expect(screen.getByTestId('chain-id')).toHaveTextContent('null');
    });

    it('exposes selectedAssetsId as an empty array', () => {
      renderWithProvider();

      expect(screen.getByTestId('assets')).toHaveTextContent('');
    });

    it('renders children', () => {
      renderWithProvider();

      expect(screen.getByText('set chain')).toBeInTheDocument();
    });
  });

  describe('setSelectedNetworkChainId', () => {
    it('updates selectedNetworkChainId to the provided chain id', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('set chain'));
      });

      expect(screen.getByTestId('chain-id')).toHaveTextContent(CHAIN_ID);
    });

    it('resets selectedNetworkChainId to null', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('set chain'));
      });
      act(() => {
        fireEvent.click(screen.getByText('clear chain'));
      });

      expect(screen.getByTestId('chain-id')).toHaveTextContent('null');
    });
  });

  describe('setSelectedAssetsId', () => {
    it('updates selectedAssetsId to the provided list', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('set assets'));
      });

      expect(screen.getByTestId('assets')).toHaveTextContent(
        [ASSET_A, ASSET_B].join(','),
      );
    });

    it('clears selectedAssetsId', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('set assets'));
      });
      act(() => {
        fireEvent.click(screen.getByText('clear assets'));
      });

      expect(screen.getByTestId('assets')).toHaveTextContent('');
    });
  });

  describe('useBatchSellSelection', () => {
    it('returns the default context values when used outside the provider', () => {
      const DefaultConsumer = () => {
        const { selectedNetworkChainId, selectedAssetsId } =
          useBatchSellSelection();
        return (
          <div>
            <span data-testid="chain-id">
              {selectedNetworkChainId ?? 'null'}
            </span>
            <span data-testid="assets">{selectedAssetsId.join(',')}</span>
          </div>
        );
      };

      render(<DefaultConsumer />);

      expect(screen.getByTestId('chain-id')).toHaveTextContent('null');
      expect(screen.getByTestId('assets')).toHaveTextContent('');
    });
  });
});
