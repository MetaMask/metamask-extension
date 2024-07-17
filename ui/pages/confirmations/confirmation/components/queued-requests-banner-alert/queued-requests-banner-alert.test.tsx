import * as React from 'react';
import configureStore from 'redux-mock-store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { QueuedRequestsBannerAlert } from './queued-requests-banner-alert';

describe('<QueuedRequestsBannerAlert />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render component', () => {
    const store = configureStore()(mockState);

    const { container } = renderWithProvider(
      <QueuedRequestsBannerAlert />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
