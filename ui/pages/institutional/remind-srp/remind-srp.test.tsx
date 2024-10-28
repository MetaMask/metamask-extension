import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { RemindSRP } from './remind-srp';

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(
    <RemindSRP secretRecoveryPhrase={TEST_SEED} />,
    store,
  );
};

describe('RemindSRP', () => {
  it('should match snapshot', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('should render some UI elements', () => {
    render();
    expect(screen.getByText('Secret Recovery Phrase')).toBeInTheDocument();

    expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();
  });

  it('should render the 12 SRP words', () => {
    const { queryAllByTestId } = render();

    expect(queryAllByTestId(/recovery-phrase-chip-/u)).toHaveLength(12);
  });
});
