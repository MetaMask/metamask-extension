import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockTokenTransferConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import NFTSendHeading, { generateTokenIdDisplay } from './nft-send-heading';

describe('<NFTSendHeading />', () => {
  const middleware = [thunk];
  const state = getMockTokenTransferConfirmState({});
  const mockStore = configureMockStore(middleware)(state);

  it('renders component', () => {
    const { container } = renderWithConfirmContextProvider(
      <NFTSendHeading />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});

describe('generateTokenIdDisplay', () => {
  it('should return same value if it is less than 10 characters long', () => {
    const tokenId = '123456789';
    const result = generateTokenIdDisplay(tokenId);
    expect(result).toBe(tokenId);
  });

  it('should return truncated value if it is 10 characters long or more', () => {
    const tokenId = '1234567890';
    const result = generateTokenIdDisplay(tokenId);
    expect(result).toBe('1234...7890');
  });
});
