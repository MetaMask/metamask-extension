import React from 'react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { PermissionsEmptyState } from './permissions-empty-state';

const store = configureStore(mockState);

describe('PermissionsEmptyState', () => {
  it('renders with default description', () => {
    const { container, getByText } = renderWithProvider(
      <PermissionsEmptyState />,
      store,
    );
    expect(container).toMatchSnapshot();
    expect(
      getByText('When you grant permissions, the details will appear here.'),
    ).toBeInTheDocument();
  });

  it('renders with custom description', () => {
    const customDescription = 'Custom empty state message';
    const { getByText } = renderWithProvider(
      <PermissionsEmptyState description={customDescription} />,
      store,
    );
    expect(getByText(customDescription)).toBeInTheDocument();
  });

  it('renders title', () => {
    const { getByText } = renderWithProvider(<PermissionsEmptyState />, store);
    expect(getByText('Nothing to see here')).toBeInTheDocument();
  });
});
