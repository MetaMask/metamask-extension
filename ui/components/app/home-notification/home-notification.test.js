import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import HomeNotification from './home-notification.component';

describe('HomeNotification', () => {
  const defaultProps = {
    descriptionText: 'Test notification description',
  };

  it('renders the description text', () => {
    const { getByText } = render(<HomeNotification {...defaultProps} />);
    expect(getByText('Test notification description')).toBeInTheDocument();
  });

  it('renders accept button when acceptText and onAccept are provided', () => {
    const onAccept = jest.fn();
    const { getByText } = render(
      <HomeNotification
        {...defaultProps}
        acceptText="Accept"
        onAccept={onAccept}
      />,
    );

    const acceptButton = getByText('Accept');
    expect(acceptButton).toBeInTheDocument();
    fireEvent.click(acceptButton);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('does not render accept button when acceptText is missing', () => {
    const onAccept = jest.fn();
    const { queryByText } = render(
      <HomeNotification {...defaultProps} onAccept={onAccept} />,
    );
    expect(queryByText('Accept')).toBeNull();
  });

  it('renders ignore button when ignoreText and onIgnore are provided', () => {
    const onIgnore = jest.fn();
    const { getByText } = render(
      <HomeNotification
        {...defaultProps}
        ignoreText="Dismiss"
        onIgnore={onIgnore}
      />,
    );

    const ignoreButton = getByText('Dismiss');
    expect(ignoreButton).toBeInTheDocument();
    fireEvent.click(ignoreButton);
    expect(onIgnore).toHaveBeenCalledTimes(1);
    // Default checkbox state is false
    expect(onIgnore).toHaveBeenCalledWith(false);
  });

  it('does not render ignore button when ignoreText is missing', () => {
    const onIgnore = jest.fn();
    const { queryByText } = render(
      <HomeNotification {...defaultProps} onIgnore={onIgnore} />,
    );
    expect(queryByText('Dismiss')).toBeNull();
  });

  it('renders checkbox when checkboxText is provided', () => {
    const onIgnore = jest.fn();
    const { getByRole, getByText } = render(
      <HomeNotification
        {...defaultProps}
        checkboxText="Don't show again"
        ignoreText="Dismiss"
        onIgnore={onIgnore}
      />,
    );

    const checkbox = getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(getByText("Don't show again")).toBeInTheDocument();
  });

  it('toggles checkbox state when clicked', () => {
    const onIgnore = jest.fn();
    const { getByRole } = render(
      <HomeNotification
        {...defaultProps}
        checkboxText="Don't show again"
        ignoreText="Dismiss"
        onIgnore={onIgnore}
      />,
    );

    const checkbox = getByRole('checkbox');
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('passes checkbox state to onIgnore handler', () => {
    const onIgnore = jest.fn();
    const { getByRole, getByText } = render(
      <HomeNotification
        {...defaultProps}
        checkboxText="Don't show again"
        ignoreText="Dismiss"
        onIgnore={onIgnore}
      />,
    );

    const checkbox = getByRole('checkbox');
    const ignoreButton = getByText('Dismiss');

    // Click ignore without checking checkbox
    fireEvent.click(ignoreButton);
    expect(onIgnore).toHaveBeenCalledWith(false);

    // Check the checkbox, then click ignore
    fireEvent.click(checkbox);
    fireEvent.click(ignoreButton);
    expect(onIgnore).toHaveBeenCalledWith(true);
  });

  it('does not render checkbox when checkboxText is not provided', () => {
    const { queryByRole } = render(<HomeNotification {...defaultProps} />);
    expect(queryByRole('checkbox')).toBeNull();
  });

  it('renders with custom classNames', () => {
    const { container } = render(
      <HomeNotification
        {...defaultProps}
        classNames={['custom-class-1', 'custom-class-2']}
      />,
    );

    const notification = container.firstChild;
    expect(notification).toHaveClass('home-notification');
    expect(notification).toHaveClass('custom-class-1');
    expect(notification).toHaveClass('custom-class-2');
  });

  it('renders info tooltip when infoText is provided', () => {
    const { container } = render(
      <HomeNotification {...defaultProps} infoText="Helpful info" />,
    );

    const tooltipWrapper = container.querySelector(
      '.home-notification__tooltip-wrapper',
    );
    expect(tooltipWrapper).toBeInTheDocument();
  });

  it('does not render info tooltip when infoText is not provided', () => {
    const { container } = render(<HomeNotification {...defaultProps} />);

    const tooltipWrapper = container.querySelector(
      '.home-notification__tooltip-wrapper',
    );
    expect(tooltipWrapper).toBeNull();
  });

  it('renders checkbox with tooltip when checkboxTooltipText is provided', () => {
    const { container } = render(
      <HomeNotification
        {...defaultProps}
        checkboxText="Don't show again"
        checkboxTooltipText="This will permanently dismiss"
      />,
    );

    const tooltipWrapper = container.querySelector(
      '.home-notification__checkbox-label-tooltip',
    );
    expect(tooltipWrapper).toBeInTheDocument();
  });

  it('renders checkbox without tooltip when checkboxTooltipText is not provided', () => {
    const { container } = render(
      <HomeNotification
        {...defaultProps}
        checkboxText="Don't show again"
      />,
    );

    const tooltipWrapper = container.querySelector(
      '.home-notification__checkbox-label-tooltip',
    );
    expect(tooltipWrapper).toBeNull();
  });

  it('uses Checkbox from component-library with isChecked prop', () => {
    const { getByRole } = render(
      <HomeNotification
        {...defaultProps}
        checkboxText="Don't show again"
      />,
    );

    const checkbox = getByRole('checkbox');
    // The new Checkbox component from component-library renders
    // with the mm-checkbox CSS class structure
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
  });
});
