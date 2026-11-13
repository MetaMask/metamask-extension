import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DropdownEditor, DropdownEditorStyle } from './dropdown-editor';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

const ITEMS = ['First endpoint', 'Second endpoint'];

// Floating UI positions the popover asynchronously, so flush that update
// inside act to keep the render tree settled before asserting.
const openDropdown = async (trigger: HTMLElement) => {
  await act(async () => {
    fireEvent.click(trigger);
  });
};

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
        title={messages.defaultRpcUrl.message}
        placeholder="Add a URL"
        items={ITEMS}
        selectedItemIndex={0}
        addButtonText={messages.addRpcUrl.message}
        style={DropdownEditorStyle.PopoverStyle}
        onItemSelected={onItemSelected}
        onItemDeleted={onItemDeleted}
        onItemAdd={onItemAdd}
        itemKey={(item) => item}
        itemDataTestId={(item) => `endpoint-${item}`}
        renderItem={(item) => <span>{item}</span>}
        renderTooltip={() => undefined}
        buttonDataTestId="rpc-dropdown"
      />,
    );

  it('renders a design-system-styled trigger', () => {
    renderEditor();

    const trigger = screen.getByRole('button', {
      name: `${messages.defaultRpcUrl.message} First endpoint`,
    });

    expect(trigger).toHaveClass('bg-muted', 'border-muted');
    expect(trigger).not.toHaveAttribute('aria-label');
    expect(trigger).toHaveAccessibleName(
      `${messages.defaultRpcUrl.message} First endpoint`,
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByText('First endpoint')).toBeInTheDocument();
  });

  it('selects an item and closes the popover', async () => {
    renderEditor();

    const trigger = screen.getByTestId('rpc-dropdown');
    await openDropdown(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    expect(screen.getByRole('listbox')).toHaveClass(
      'max-h-40',
      'overflow-y-auto',
    );
    const secondOption = screen.getByTestId('endpoint-Second endpoint');
    expect(secondOption).toHaveAttribute('type', 'button');
    fireEvent.click(secondOption);

    expect(onItemSelected).toHaveBeenCalledWith(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the popover when Escape is pressed', async () => {
    renderEditor();

    const trigger = screen.getByTestId('rpc-dropdown');
    await openDropdown(trigger);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('deletes an item without selecting it', async () => {
    renderEditor();

    await openDropdown(screen.getByTestId('rpc-dropdown'));
    fireEvent.click(screen.getByTestId('delete-item-1'));

    expect(onItemDeleted).toHaveBeenCalledWith(1, 0);
    expect(onItemSelected).not.toHaveBeenCalled();
  });

  it('opens the add-item flow', async () => {
    renderEditor();

    await openDropdown(screen.getByTestId('rpc-dropdown'));
    const addButton = screen.getByRole('button', {
      name: messages.addRpcUrl.message,
    });
    const xpathMatch = document.evaluate(
      `//button[contains(text(), "${messages.addRpcUrl.message}")]`,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;

    expect(xpathMatch).toBe(addButton);
    fireEvent.click(addButton);

    expect(onItemAdd).toHaveBeenCalledTimes(1);
  });
});
