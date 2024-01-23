import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockSendState from '../../../../../test/data/mock-send-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import SendAssetRow from './send-asset-row.component';

const mockStore = configureMockStore()(mockSendState);

const props = {
  tokens: [],
  selectedAddress: '0x0',
  nfts: [],
  collections: [],
  sendAsset: {
    balance: '0x1',
    details: {
      address: '0xb9b9c1592e737a2c71d80d3b8495049990161e0c',
      tokenId: '2',
      standard: 'ERC721',
      tokenURI:
        'data:application/json;base64,eyJuYW1lIjogIlRlc3QgRGFwcCBDb2xsZWN0aWJsZXMgIzIiLCAiZGVzY3JpcHRpb24iOiAiVGVzdCBEYXBwIENvbGxlY3RpYmxlcyBmb3IgdGVzdGluZy4iLCAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCb1pXbG5hSFE5SWpNMU1DSWdkMmxrZEdnOUlqTTFNQ0lnZG1sbGQwSnZlRDBpTUNBd0lERXdNQ0F4TURBaUlIaHRiRzV6UFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJK1BHUmxabk0rUEhCaGRHZ2dhV1E5SWsxNVVHRjBhQ0lnWm1sc2JEMGlibTl1WlNJZ2MzUnliMnRsUFNKeVpXUWlJR1E5SWsweE1DdzVNQ0JST1RBc09UQWdPVEFzTkRVZ1VUa3dMREV3SURVd0xERXdJRkV4TUN3eE1DQXhNQ3cwTUNCUk1UQXNOekFnTkRVc056QWdVVGN3TERjd0lEYzFMRFV3SWlBdlBqd3ZaR1ZtY3o0OGRHVjRkRDQ4ZEdWNGRGQmhkR2dnYUhKbFpqMGlJMDE1VUdGMGFDSStVWFZwWTJzZ1luSnZkMjRnWm05NElHcDFiWEJ6SUc5MlpYSWdkR2hsSUd4aGVua2daRzluTGp3dmRHVjRkRkJoZEdnK1BDOTBaWGgwUGp3dmMzWm5QZz09IiwgImF0dHJpYnV0ZXMiOiBbeyJ0cmFpdF90eXBlIjogIlRva2VuIElkIiwgInZhbHVlIjogIjIifV19',
      symbol: 'TDC',
      name: 'TestDappNFTs',
      image:
        'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
    },
    error: null,
    type: 'NFT',
  },
  accounts: {
    '0x0': {
      address: '0x0',
      balance: '0x4cc191087ecfcee6',
    },
    '0x1': {
      address: '0x1',
      balance: '0x041813d3a1fc67ed',
    },
  },
};

describe('SendAssetRow', () => {
  describe('Sending NFT', () => {
    it('should render NFT image even if NFT is not imported into metamask', async () => {
      const { getByRole } = renderWithProvider(
        <SendAssetRow {...props} />,
        mockStore,
      );

      const image = getByRole('img');
      expect(image).toBeDefined();
      expect(image).toHaveAttribute('src', props.sendAsset.details.image);
    });

    it('should render token id even if NFT is not imported into metamask', async () => {
      const { getByText } = renderWithProvider(
        <SendAssetRow {...props} />,
        mockStore,
      );

      expect(getByText('Token ID: 2')).toBeInTheDocument();
    });
  });
});
