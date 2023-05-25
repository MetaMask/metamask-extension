import {
  fireEvent,
  queryByRole,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SecurityTab from './security-tab.container';

const mockSetFeatureFlag = jest.fn();
const mockSetParticipateInMetaMetrics = jest.fn();
const mockSetUsePhishDetect = jest.fn();
const mockSetUseCurrencyRateCheck = jest.fn();

jest.mock('../../../store/actions.ts', () => {
  return {
    setFeatureFlag: () => mockSetFeatureFlag,
    setParticipateInMetaMetrics: () => mockSetParticipateInMetaMetrics,
    setUsePhishDetect: () => mockSetUsePhishDetect,
    setUseCurrencyRateCheck: () => mockSetUseCurrencyRateCheck,
  };
});

describe('Security Tab', () => {
  const mockStore = configureMockStore()(mockState);

  function testToggleCheckbox(testId, initialState) {
    renderWithProvider(<SecurityTab />, mockStore);

    const container = screen.getByTestId(testId);
    const checkbox = queryByRole(container, 'checkbox');

    expect(checkbox).toHaveAttribute('value', initialState ? 'true' : 'false');

    // TODO: This actually doesn't fire the onToggle method of the ToggleButton, and it never has in this test suite.
    //       Implementing it properly requires a lot of mocks.
    fireEvent.change(checkbox, {
      target: { value: !initialState },
    });

    expect(checkbox).toHaveAttribute('value', initialState ? 'false' : 'true');
  }

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<SecurityTab />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('toggles phishing detection', () => {
    testToggleCheckbox('usePhishingDetection', true);
  });

  it('toggles balance and token price checker', () => {
    testToggleCheckbox('currencyRateCheckToggle', true);
  });

  it('toggles incoming txs', () => {
    testToggleCheckbox('showIncomingTransactions', true);
  });

  it('should toggle token detection', () => {
    testToggleCheckbox('autoDetectTokens', true);
  });

  it('toggles batch balance checks', () => {
    testToggleCheckbox('useMultiAccountBalanceChecker', false);
  });

  it('toggles metaMetrics', () => {
    testToggleCheckbox('participateInMetaMetrics', false);
  });

  it('toggles SRP Quiz', async () => {
    renderWithProvider(<SecurityTab />, mockStore);

    expect(screen.queryByText('Get started')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Reveal Secret Recovery Phrase'));

    expect(screen.queryByText('Get started')).toBeInTheDocument();

    const container = screen.getByTestId('srp-quiz-header');
    const checkbox = queryByRole(container, 'button');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.queryByText('Get started')).not.toBeInTheDocument();
    });
  });
});
