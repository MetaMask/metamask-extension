import React from 'react';
import reactRouterDom from 'react-router-dom';
import { fireEvent, screen } from '@testing-library/react';
import * as reactRedux from 'react-redux';
import sinon from 'sinon';
import {
  ASSET_ROUTE,
  IMPORT_TOKEN_ROUTE,
} from '../../helpers/constants/routes';
import { addTokens, clearPendingTokens } from '../../store/actions';
import {
  getCurrentCurrency,
  getNativeCurrency,
  getConversionRate,
} from '../../selectors';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/jest';
import mockState from '../../../test/data/mock-state.json';
import ConfirmTokenTransaction from '.';

const DEFAULT_ARGS = {
  image:
    'https://i.seadn.io/gcs/files/9667967e4080e51200986b7c76d6ee1d.jpg?w=500&auto=format',
  assetName: 'Monkey Trip #2422',
  toAddress: '0x0836f5ed6b62baf60706fe3adc0ff0fd1df833da',
  tokenAddress: '0xd648922586e98bebf1d8f5833fb6cbe3fcf36fcc',
  tokenAmount: '0',
  tokenSymbol: undefined,
  tokenId: '2422',
  assetStandard: 'ERC721',
  onEdit: () => undefined,
  ethTransactionTotal: '0.000006',
  fiatTransactionTotal: '0.01',
  hexMaximumTransactionFee: '0xa8192d0e6ecec',
};

const renderComponent = (args = DEFAULT_ARGS) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      // pendingTokens: { ...mockPendingTokens },
      provider: { chainId: '0x1' },
      cachedBalances: {
        '0x1': {},
      },
    },
    history: {
      mostRecentOverviewPage: '/',
    },
  });

  return renderWithProvider(<ConfirmTokenTransaction {...args} />, store);
};

describe('ConfirmTokenTransaction Component', () => {
  it('should render', () => {
    const stub = sinon.stub(reactRedux, 'useSelector');
    stub.callsFake((selector) => {
      if (selector === getCurrentCurrency) {
        return 'usd';
      } else if (selector === getNativeCurrency) {
        return 'ETH';
      } else if (selector === getConversionRate) {
        return 280.45;
      }
      return undefined;
    });

    const { getByText } = renderComponent();
    expect(getByText('Monkey Trip #2422')).toBeInTheDocument(title);
  });
});
