import * as React from 'react';
import { BlockaidUnavailableBannerAlert } from './blockaid-unavailable-banner-alert';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';

describe('<BlockaidUnavailableBannerAlert />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const render = (storeOverrides: Record<string, any> = {}) => {
    const store = configureStore({
      ...mockState.metamask,
      metamask: { ...mockState.metamask },
      ...storeOverrides,
    });

    return renderWithProvider(<BlockaidUnavailableBannerAlert />, store);
  };

  it("should not render if user hasn't been migrated to blockaid", () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('should render if user has been migrated to blockaid', () => {
    const { container } = render({
      metamask: {
        hasMigratedFromOpenSeaToBlockaid: true,
      },
    });

    expect(container).toMatchSnapshot();
  });
});
