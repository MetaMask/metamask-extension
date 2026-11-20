import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { DottedTrigger } from './dotted-trigger';

const store = configureStore(mockState);

describe('DottedTrigger', () => {
  it('renders a button with a dotted underline and invokes onClick', () => {
    const onClick = jest.fn();
    renderWithProvider(
      <DottedTrigger
        data-testid="dotted-trigger"
        onClick={onClick}
        text="6.2% APY"
      />,
      store,
    );

    const trigger = screen.getByTestId('dotted-trigger');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveTextContent('6.2% APY');
    expect(trigger).toHaveClass('underline', 'decoration-dotted');

    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
