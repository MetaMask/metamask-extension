import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DropdownEditor, DropdownEditorStyle } from './dropdown-editor';

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const react = jest.requireActual('react');
  return {
    ...actual,
    Popover: ({
      children,
      isOpen,
      role,
    }: {
      children: React.ReactNode;
      isOpen: boolean;
      role: React.AriaRole;
    }) => (isOpen ? react.createElement('div', { role }, children) : null),
  };
});

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

  it('selects an item and closes the popover', () => {
    renderEditor();

    const trigger = screen.getByTestId('rpc-dropdown');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('option', { name: /Second endpoint/u }));

    expect(onItemSelected).toHaveBeenCalledWith(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('deletes an item without selecting it', () => {
    renderEditor();

    fireEvent.click(screen.getByTestId('rpc-dropdown'));
    const secondOption = screen.getByRole('option', {
      name: /Second endpoint/u,
    });
    fireEvent.click(
      within(secondOption).getByRole('button', { name: 'delete' }),
    );

    expect(onItemDeleted).toHaveBeenCalledWith(1, 0);
    expect(onItemSelected).not.toHaveBeenCalled();
  });

  it('opens the add-item flow', () => {
    renderEditor();

    fireEvent.click(screen.getByTestId('rpc-dropdown'));
    fireEvent.click(screen.getByRole('button', { name: 'Add RPC URL' }));

    expect(onItemAdd).toHaveBeenCalledTimes(1);
  });
});
