import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { TabEmptyState } from './tab-empty-state';

describe('TabEmptyState', () => {
  const mockOnAction = jest.fn();
  const testIcon = <div data-testid="test-icon">Test Icon</div>;

  beforeEach(() => {
    mockOnAction.mockClear();
  });

  it('should render the component without crashing', () => {
    render(<TabEmptyState icon={testIcon} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should render the provided icon', () => {
    render(<TabEmptyState icon={testIcon} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    const description = 'This is a test description';
    render(<TabEmptyState icon={testIcon} description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const { container } = render(<TabEmptyState icon={testIcon} />);

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('should render action button when actionButtonText is provided', () => {
    const buttonText = 'Click me';
    render(
      <TabEmptyState
        icon={testIcon}
        actionButtonText={buttonText}
        onAction={mockOnAction}
      />,
    );

    expect(
      screen.getByRole('button', { name: buttonText }),
    ).toBeInTheDocument();
  });

  it('should not render action button when actionButtonText is not provided', () => {
    render(<TabEmptyState icon={testIcon} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onAction when action button is clicked', () => {
    const buttonText = 'Click me';
    render(
      <TabEmptyState
        icon={testIcon}
        actionButtonText={buttonText}
        onAction={mockOnAction}
      />,
    );

    const button = screen.getByRole('button', { name: buttonText });
    fireEvent.click(button);

    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const customClass = 'custom-empty-state';
    const { container } = render(
      <TabEmptyState icon={testIcon} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it('should pass descriptionProps to description Text component', () => {
    const description = 'Test description';
    const descriptionProps = { 'data-testid': 'custom-description' };
    render(
      <TabEmptyState
        icon={testIcon}
        description={description}
        descriptionProps={descriptionProps}
      />,
    );

    expect(screen.getByTestId('custom-description')).toBeInTheDocument();
    expect(screen.getByTestId('custom-description')).toHaveTextContent(
      description,
    );
  });

  it('should pass actionButtonProps to action Button component', () => {
    const buttonText = 'Action button';
    const actionButtonProps = { 'data-testid': 'custom-button' };
    render(
      <TabEmptyState
        icon={testIcon}
        actionButtonText={buttonText}
        onAction={mockOnAction}
        actionButtonProps={actionButtonProps}
      />,
    );

    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    expect(screen.getByTestId('custom-button')).toHaveTextContent(buttonText);
  });

  it('should render all elements when all props are provided', () => {
    const description = 'Complete description';
    const buttonText = 'Complete action';
    render(
      <TabEmptyState
        icon={testIcon}
        description={description}
        actionButtonText={buttonText}
        onAction={mockOnAction}
      />,
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: buttonText }),
    ).toBeInTheDocument();
  });

  it('should have correct default styling classes', () => {
    const { container } = render(<TabEmptyState icon={testIcon} />);

    expect(container.firstChild).toHaveClass('max-w-56');
  });
});
