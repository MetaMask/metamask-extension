import * as React from 'react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import ClearMetaMetricsData from './clear-metametrics-data';

describe('ClearMetaMetricsData', () => {
  it('should render the data deletion error modal', async () => {
    const store = configureStore({});
    const { getByText } = renderWithProvider(<ClearMetaMetricsData />, store);

    expect(getByText('Delete MetaMetrics data?')).toBeInTheDocument();
    expect(
      getByText(
        'We are about to remove all your MetaMetrics data. Are you sure?',
      ),
    ).toBeInTheDocument();
  });
});
