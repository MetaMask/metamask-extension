import { storiesMetadata } from './loading-swaps-quotes-stories-metadata';

describe('storiesMetadata', () => {
  it('matches expected values for storiesMetadata', () => {
    expect(storiesMetadata).toMatchSnapshot();
  });
});
