import React, { FC } from 'react';
import { render } from '@testing-library/react';
import log from 'loglevel';
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
