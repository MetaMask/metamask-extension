import * as React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';
import { ExistingRequestsBannerAlert } from './existing-requests-banner-alert';

describe('<ExistingRequestsBannerAlert />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const render = (storeOverrides: Record<string, any> = {}) => {
    const store = configureStore({
      ...mockState.metamask,
      metamask: { ...mockState.metamask },
      ...storeOverrides,
    });

    return renderWithProvider(<ExistingRequestsBannerAlert />, store);
  };

  it('should render component', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });
});
