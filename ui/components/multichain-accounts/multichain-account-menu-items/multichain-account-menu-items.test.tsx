import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { TextColor } from '../../../helpers/constants/design-system';
import { IconName } from '../../component-library';
import { MultichainAccountMenuItems } from './multichain-account-menu-items';

const menuItemSelector = '.multichain-account-cell-menu-item';

describe('MultichainAccountMenuItems', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultMenuConfig = [
    {
      textKey: 'accountDetails',
      iconName: IconName.Details,
      textColor: TextColor.textDefault,
      onClick: mockOnClick,
    },
    {
      textKey: 'rename',
      iconName: IconName.Edit,
      textColor: TextColor.textDefault,
      onClick: mockOnClick,
    },
    {
      textKey: 'remove',
      iconName: IconName.Trash,
      textColor: TextColor.errorDefault,
      onClick: mockOnClick,
    },
  ];

  it('renders all menu items with correct styling', () => {
    renderWithProvider(
      <MultichainAccountMenuItems menuConfig={defaultMenuConfig} />,
    );

    const menuItems = document.querySelectorAll(menuItemSelector);

    expect(menuItems).toHaveLength(3);
    expect(menuItems[0]).toHaveClass(
      'multichain-account-cell-menu-item--with-border',
    );
    expect(menuItems[0]).toHaveClass(
      'multichain-account-cell-menu-item--enabled',
    );
    expect(menuItems[1]).toHaveClass(
      'multichain-account-cell-menu-item--with-border',
    );
    expect(menuItems[2]).not.toHaveClass(
      'multichain-account-cell-menu-item--with-border',
    );
    expect(menuItems[2]).toHaveClass(
      'multichain-account-cell-menu-item--enabled',
    );
  });

  it('triggers onClick handlers when menu items are clicked', () => {
    renderWithProvider(
      <MultichainAccountMenuItems menuConfig={defaultMenuConfig} />,
    );

    const menuItems = document.querySelectorAll(menuItemSelector);

    fireEvent.click(menuItems[0]);
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    fireEvent.click(menuItems[1]);
    expect(mockOnClick).toHaveBeenCalledTimes(2);

    fireEvent.click(menuItems[2]);
    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });
});
