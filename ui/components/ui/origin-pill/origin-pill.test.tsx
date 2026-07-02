import { screen } from '@testing-library/dom';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
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

    const textElement = screen.getByTestId(`${defaultProps.dataTestId}-text`);
    expect(textElement).toHaveClass('text-alternative');
    expect(textElement.tagName).toBe('H6');
  });
});
