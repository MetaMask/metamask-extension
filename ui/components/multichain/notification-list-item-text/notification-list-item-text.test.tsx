import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  NotificationListItemText,
  type NotificationListItemTextProps,
} from './notification-list-item-text';

describe('NotificationListItemText', () => {
  const defaultProps: NotificationListItemTextProps = {
    items: [
      { text: 'Test text 1', highlighted: true },
      { text: 'Test text 2' },
    ],
    variant: TextVariant.bodySm,
  };

  it('should render the correct text items', () => {
    render(<NotificationListItemText {...defaultProps} />);
    expect(screen.getByText('Test text 1')).toBeDefined();
    expect(screen.getByText('Test text 2')).toBeDefined();
  });

  it('should highlight the text if highlighted prop is true', () => {
    render(<NotificationListItemText {...defaultProps} />);
    const highlightedText = screen.getByText('Test text 1');
    expect(highlightedText).toHaveStyle(`color: ${TextColor.infoDefault}`);
  });

  it('should not highlight the text if highlighted prop is false or undefined', () => {
    render(<NotificationListItemText {...defaultProps} />);
    const normalText = screen.getByText('Test text 2');
    expect(normalText).toHaveStyle(`color: ${TextColor.textAlternative}`);
  });
});
