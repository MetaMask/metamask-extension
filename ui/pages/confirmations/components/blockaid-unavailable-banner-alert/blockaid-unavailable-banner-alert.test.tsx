import * as React from 'react';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { BlockaidUnavailableBannerAlert } from './blockaid-unavailable-banner-alert';

describe('<BlockaidUnavailableBannerAlert />', () => {
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
