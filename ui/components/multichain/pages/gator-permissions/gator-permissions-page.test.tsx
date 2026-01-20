import React from 'react';
import { Hex } from '@metamask/utils';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { GatorPermissionsPage } from './gator-permissions-page';

const MOCK_CHAIN_ID = '0x1' as Hex;

mockState.metamask.gatorPermissionsMapSerialized = JSON.stringify({
  'native-token-periodic': {
    [MOCK_CHAIN_ID]: [
      {
        permissionResponse: {
          chainId: MOCK_CHAIN_ID,
          address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
          permission: {
            type: 'native-token-periodic',
            isAdjustmentAllowed: false,
            data: {
              periodAmount: '0x22b1c8c1227a0000',
              periodDuration: 1747699200,
              startTime: 1747699200,
              justification:
                'This is a very important request for streaming allowance for some very important thing',
            },
          },
          context: '0x00000000',
          signerMeta: {
            delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
          },
        },
        siteOrigin: 'http://localhost:8000',
      },
    ],
  },
  'native-token-stream': {},
  'erc20-token-stream': {},
  'erc20-token-periodic': {},
  'erc20-token-revocation': {},
  other: {},
});
mockState.metamask.isGatorPermissionsEnabled = true;
mockState.metamask.isFetchingGatorPermissions = false;
mockState.metamask.isUpdatingGatorPermissions = false;

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
});

describe('Gator Permissions Page', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <GatorPermissionsPage />,
        store,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('gator-permissions-page')).toBeInTheDocument();
    });

    it('renders Gator Permissions page title', () => {
      const { getByTestId } = renderWithProvider(
        <GatorPermissionsPage />,
        store,
      );
      expect(getByTestId('gator-permissions-page-title')).toBeInTheDocument();
    });
  });
});
