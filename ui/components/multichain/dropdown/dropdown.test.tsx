import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { Dropdown, dropdownOptionProps } from './dropdown';

describe('Dropdown', () => {
  const renderDropdown = () =>
    render(
      <div className="relative">
        <input aria-label={messages.search.message} />
        <Dropdown>
          <button type="button" {...dropdownOptionProps}>
            First
          </button>
          <button type="button" {...dropdownOptionProps}>
            Second
          </button>
        </Dropdown>
      </div>,
    );

  it('moves between options with the arrow keys', () => {
    renderDropdown();

    const search = screen.getByRole('textbox', {
      name: messages.search.message,
    });
    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });
    search.focus();

    act(() => {
      fireEvent.keyDown(search, { key: 'ArrowDown' });
    });
    expect(first).toHaveFocus();

    act(() => {
      fireEvent.keyDown(first, { key: 'ArrowDown' });
    });
    expect(second).toHaveFocus();
  });

  it('leaves options in the tab order', () => {
    renderDropdown();

    expect(screen.getByRole('button', { name: 'First' })).not.toHaveAttribute(
      'tabindex',
      '-1',
    );
  });
});
