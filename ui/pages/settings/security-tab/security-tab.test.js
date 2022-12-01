import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SecurityTab from './security-tab.container';

const mockSetFeatureFlag = jest.fn();
const mockSetParticipateInMetaMetrics = jest.fn();
const mockSetUsePhishDetect = jest.fn();
const mockSetUseCurrencyRateCheck = jest.fn();

jest.mock('../../../store/actions.js', () => {
  return {
    setFeatureFlag: () => mockSetFeatureFlag,
    setParticipateInMetaMetrics: () => mockSetParticipateInMetaMetrics,
    setUsePhishDetect: () => mockSetUsePhishDetect,
    setUseCurrencyRateCheck: () => mockSetUseCurrencyRateCheck,
  };
});

describe('Security Tab', () => {
  const mockStore = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<SecurityTab />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('navigates to reveal seed words page', () => {
    const { queryByTestId, history } = renderWithProvider(
      <SecurityTab />,
      mockStore,
    );

    expect(history.location.pathname).toStrictEqual('/');

    fireEvent.click(queryByTestId('reveal-seed-words'));

    expect(history.location.pathname).toStrictEqual('/seed');
  });

  it('toggles incoming txs', () => {
    const { queryAllByRole } = renderWithProvider(<SecurityTab />, mockStore);

    const checkboxes = queryAllByRole('checkbox');
    const showIncomingCheckbox = checkboxes[0];

    expect(showIncomingCheckbox).toHaveAttribute('value', 'true');

    fireEvent.change(showIncomingCheckbox, {
      target: { value: false },
    });

    expect(showIncomingCheckbox).toHaveAttribute('value', 'false');
  });

  it('toggles phishing detection', () => {
    const { queryAllByRole } = renderWithProvider(<SecurityTab />, mockStore);

    const checkboxes = queryAllByRole('checkbox');
    const showIncomingCheckbox = checkboxes[1];

    expect(showIncomingCheckbox).toHaveAttribute('value', 'true');

    fireEvent.change(showIncomingCheckbox, {
      target: { value: false },
    });

    expect(showIncomingCheckbox).toHaveAttribute('value', 'false');
  });

  it('toggles metaMetrics', () => {
    const { queryAllByRole } = renderWithProvider(<SecurityTab />, mockStore);

    const checkboxes = queryAllByRole('checkbox');
    const showIncomingCheckbox = checkboxes[2];

    expect(showIncomingCheckbox).toHaveAttribute('value', 'false');

    fireEvent.change(showIncomingCheckbox, {
      target: { value: true },
    });

    expect(showIncomingCheckbox).toHaveAttribute('value', 'true');
  });

  it('toggles batch balance checks', () => {
    const { queryAllByRole } = renderWithProvider(<SecurityTab />, mockStore);

    const checkboxes = queryAllByRole('checkbox');
    const batchBalanceChecksCheckbox = checkboxes[3];

    expect(batchBalanceChecksCheckbox).toHaveAttribute('value', 'false');

    fireEvent.change(batchBalanceChecksCheckbox, {
      target: { value: true },
    });

    expect(batchBalanceChecksCheckbox).toHaveAttribute('value', 'true');
  });
});
