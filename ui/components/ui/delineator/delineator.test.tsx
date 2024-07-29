import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextColor } from '../../../helpers/constants/design-system';
import { IconName, Text } from '../../component-library';
import { DelineatorType } from './delineator.types';
import { Delineator } from './delineator';

describe('Delineator Component', () => {
  const CONTENT_TEXT_MOCK = 'Content text';
  const HEADER_TEXT_MOCK = 'Header text';
  const headerComponent = (
    <Text color={TextColor.textAlternative}>Header text</Text>
  );
  const exampleContent = <Text>{CONTENT_TEXT_MOCK}</Text>;

  it('renders correctly with minimal props', () => {
    const { getByText } = render(
      <Delineator headerComponent={headerComponent} iconName={IconName.Snaps}>
        {exampleContent}
      </Delineator>,
    );

    expect(getByText(HEADER_TEXT_MOCK)).toBeInTheDocument();
    expect(screen.queryByText(CONTENT_TEXT_MOCK)).not.toBeInTheDocument();
  });

  it('expands/collapses when header is clicked', () => {
    const { getByText } = render(
      <Delineator
        headerComponent={headerComponent}
        iconName={IconName.Snaps}
        isCollapsible
      >
        {exampleContent}
      </Delineator>,
    );

    fireEvent.click(getByText(HEADER_TEXT_MOCK));
    expect(getByText(CONTENT_TEXT_MOCK)).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(getByText(HEADER_TEXT_MOCK));
    expect(screen.queryByText(CONTENT_TEXT_MOCK)).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <Delineator
        headerComponent={headerComponent}
        iconName={IconName.Snaps}
        isLoading
      >
        {exampleContent}
      </Delineator>,
    );

    expect(screen.queryByText(CONTENT_TEXT_MOCK)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('always shows content when isCollapsible is false or on collapse click', () => {
    const { getByText } = render(
      <Delineator
        headerComponent={headerComponent}
        iconName={IconName.Snaps}
        isCollapsible={false}
      >
        {exampleContent}
      </Delineator>,
    );

    fireEvent.click(getByText(HEADER_TEXT_MOCK));
    expect(getByText(CONTENT_TEXT_MOCK)).toBeInTheDocument();
  });

  it('forces header text color properly when type is error', () => {
    const { getByText } = render(
      <Delineator
        headerComponent={headerComponent}
        iconName={IconName.Snaps}
        type={DelineatorType.Error}
      >
        {exampleContent}
      </Delineator>,
    );

    expect(getByText(HEADER_TEXT_MOCK)).toHaveClass(
      'mm-box--color-error-default',
    );
  });

  it('calls onExpandChange when header is clicked', () => {
    const onExpandChangeMock = jest.fn();
    const { getByText } = render(
      <Delineator
        headerComponent={headerComponent}
        iconName={IconName.Snaps}
        isCollapsible
        onExpandChange={onExpandChangeMock}
      >
        {exampleContent}
      </Delineator>,
    );

    fireEvent.click(getByText(HEADER_TEXT_MOCK));
    expect(onExpandChangeMock).toHaveBeenCalledWith(true);

    fireEvent.click(getByText(HEADER_TEXT_MOCK));
    expect(onExpandChangeMock).toHaveBeenCalledWith(false);
  });
});
