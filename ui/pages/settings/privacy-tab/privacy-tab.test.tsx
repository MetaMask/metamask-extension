import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import PrivacyTab from './privacy-tab';

// Avoid unit test warning from react-toggle-button (deprecated componentWillReceiveProps via react-motion).
jest.mock('react-toggle-button', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  function mockToggle({
    value,
    onToggle,
    passThroughInputProps,
  }: {
    value: boolean;
    onToggle: (v: boolean) => void;
    passThroughInputProps?: { 'data-testid'?: string };
  }) {
    return ReactActual.createElement('input', {
      type: 'checkbox',
      checked: value,
      'data-testid': passThroughInputProps?.['data-testid'],
      onChange: () => onToggle(value),
      readOnly: true,
    });
  }
  return mockToggle;
});

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('PrivacyTab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(<PrivacyTab />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });
});
