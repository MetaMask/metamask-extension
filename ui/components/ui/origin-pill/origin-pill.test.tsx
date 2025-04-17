import { screen } from '@testing-library/dom';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import OriginPill from './origin-pill';

describe('<OriginPill />', () => {
  it('renders correct elements', () => {
    const defaultProps = {
      origin: 'Test Origin',
      dataTestId: 'test-data-test-id',
    };
    const store = configureMockStore()(mockState);

    renderWithProvider(<OriginPill {...defaultProps} />, store);

    expect(screen.getByTestId(defaultProps.dataTestId)).toBeDefined();
    expect(
      screen.getByTestId(`${defaultProps.dataTestId}-avatar-favicon`),
    ).toBeDefined();
    expect(screen.getByTestId(`${defaultProps.dataTestId}-text`)).toBeDefined();
    expect(
      screen.getByTestId(`${defaultProps.dataTestId}-text`),
    ).toHaveTextContent(defaultProps.origin);
  });
});
