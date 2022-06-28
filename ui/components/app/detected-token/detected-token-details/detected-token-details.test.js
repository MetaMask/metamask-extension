import * as React from 'react';
import {
  renderWithProvider,
  screen,
  fireEvent,
} from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';

import DetectedTokenDetails from './detected-token-details';

describe('DetectedTokenDetails', () => {
  const args = {
    tokenAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  };

  it('should render the detected token details', async () => {
    const store = configureStore(testData);
    renderWithProvider(<DetectedTokenDetails {...args} />, store);

    expect(screen.getByText('0 SNX')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('Token address:')).toBeInTheDocument();
    expect(screen.getByText('0xc01...2a6f')).toBeInTheDocument();
    expect(screen.getByText('From token lists:')).toBeInTheDocument();
    expect(screen.getByText('Aave, Bancor')).toBeInTheDocument();
    expect(screen.getByText('+ 10 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ 10 more'));
    expect(
      screen.getByText(
        'Aave, Bancor, CMC, Crypto.com, CoinGecko, 1inch, Paraswap, PMM, Synthetix, Zapper, Zerion, 0x.',
      ),
    ).toBeInTheDocument();
  });
});
