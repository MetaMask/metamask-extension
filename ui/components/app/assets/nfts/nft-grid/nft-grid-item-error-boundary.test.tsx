// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { FC } from 'react';
import { render } from '@testing-library/react';
import log from 'loglevel';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import NFTGridItemErrorBoundary from './nft-grid-item-error-boundary';

describe('NFTGridItemErrorBoundary tests', () => {
  it('should fallback if grid item crashes', () => {
    const mockError = jest.spyOn(log, 'error').mockImplementation(jest.fn());

    const MockGridItem: FC = () => {
      throw new Error('Mock Error');
    };

    const { container } = render(
      <NFTGridItemErrorBoundary fallback={() => null}>
        <MockGridItem />
      </NFTGridItemErrorBoundary>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockError).toHaveBeenCalled();
  });
});
