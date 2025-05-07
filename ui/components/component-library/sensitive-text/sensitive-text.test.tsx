import React from 'react';
import { render, screen } from '@testing-library/react';
import { SensitiveText } from './sensitive-text';
import { SensitiveTextLength } from './sensitive-text.types';

describe('SensitiveText', () => {
  const testProps = {
    isHidden: false,
    length: SensitiveTextLength.Short,
    children: 'Sensitive Information',
  };

  it('should render correctly', () => {
    const { container } = render(<SensitiveText {...testProps} />);
    expect(container).toMatchSnapshot();
  });

  it('should display the text when isHidden is false', () => {
    render(<SensitiveText {...testProps} />);
    expect(screen.getByText('Sensitive Information')).toBeInTheDocument();
  });

  it('should hide the text when isHidden is true', () => {
    render(<SensitiveText {...testProps} isHidden />);
    expect(screen.queryByText('Sensitive Information')).not.toBeInTheDocument();
    expect(screen.getByText('••••••')).toBeInTheDocument();
  });

  it('should render the correct number of bullets for different lengths', () => {
    const lengths = [
      SensitiveTextLength.Short,
      SensitiveTextLength.Medium,
      SensitiveTextLength.Long,
      SensitiveTextLength.ExtraLong,
    ];

    lengths.forEach((length) => {
      render(<SensitiveText {...testProps} isHidden length={length} />);
      expect(screen.getByText('•'.repeat(Number(length)))).toBeInTheDocument();
    });
  });

  it('should handle all predefined SensitiveTextLength values', () => {
    Object.entries(SensitiveTextLength).forEach(([_, value]) => {
      render(<SensitiveText {...testProps} isHidden length={value} />);
      expect(screen.getByText('•'.repeat(Number(value)))).toBeInTheDocument();
    });
  });

  it('should handle custom length as a string', () => {
    render(<SensitiveText {...testProps} isHidden length="15" />);
    expect(screen.getByText('•'.repeat(15))).toBeInTheDocument();
  });

  it('should fall back to Short length for invalid custom length', () => {
    render(<SensitiveText {...testProps} isHidden length="invalid" />);
    expect(
      screen.getByText('•'.repeat(Number(SensitiveTextLength.Short))),
    ).toBeInTheDocument();
  });

  it('should log a warning for invalid custom length', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(<SensitiveText {...testProps} isHidden length="abc" />);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid length provided: abc. Falling back to Short.',
    );
    consoleSpy.mockRestore();
  });

  it('should apply additional props to the Text component', () => {
    render(<SensitiveText {...testProps} data-testid="sensitive-text" />);
    expect(screen.getByTestId('sensitive-text')).toBeInTheDocument();
  });

  it('should forward ref to the Text component', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<SensitiveText {...testProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});
