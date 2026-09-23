import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DropdownEditor, DropdownEditorStyle } from './dropdown-editor';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

const ITEMS = ['First endpoint', 'Second endpoint'];

describe('DropdownEditor', () => {
  const onItemSelected = jest.fn();
  const onItemDeleted = jest.fn();
  const onItemAdd = jest.fn();

  beforeEach(() => {
    jest.mocked(useI18nContext).mockReturnValue((key: string) => key);
    jest.clearAllMocks();
  });

  const renderEditor = () =>
    render(
      <DropdownEditor
        title="Default RPC URL"
        placeholder="Add a URL"
        items={ITEMS}
        selectedItemIndex={0}
        addButtonText="Add RPC URL"
        style={DropdownEditorStyle.PopoverStyle}
        onItemSelected={onItemSelected}
        onItemDeleted={onItemDeleted}
        onItemAdd={onItemAdd}
        itemKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        renderTooltip={() => undefined}
        buttonDataTestId="rpc-dropdown"
      />,
    );

  it('renders a design-system-styled trigger', () => {
    renderEditor();

    const trigger = screen.getByRole('button', {
      name: 'Default RPC URL',
    });

    expect(trigger).toHaveClass('bg-muted', 'border-muted');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByText('First endpoint')).toBeInTheDocument();
  });

  it('selects an item and closes the popover', async () => {
    const user = userEvent.setup();
    renderEditor();

    const trigger = screen.getByTestId('rpc-dropdown');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('option', { name: /Second endpoint/u }));

    expect(onItemSelected).toHaveBeenCalledWith(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('deletes an item without selecting it', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByTestId('rpc-dropdown'));
    const secondOption = screen.getByRole('option', {
      name: /Second endpoint/u,
    });
    await user.click(
      within(secondOption).getByRole('button', { name: 'delete' }),
    );

    expect(onItemDeleted).toHaveBeenCalledWith(1, 0);
    expect(onItemSelected).not.toHaveBeenCalled();
  });

  it('opens the add-item flow', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByTestId('rpc-dropdown'));
    await user.click(screen.getByRole('button', { name: 'Add RPC URL' }));

    expect(onItemAdd).toHaveBeenCalledTimes(1);
  });
});
