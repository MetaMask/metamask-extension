import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Text } from '../../../../component-library';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
  ConfirmInfoRowSkeleton,
} from './row';

describe('ConfirmInfoRow', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoRow label="some label">
        <Text>Some text</Text>
      </ConfirmInfoRow>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when copy is enabled', () => {
    const { container } = render(
      <ConfirmInfoRow label="some label" copyEnabled copyText="dummy text">
        <Text>Some text</Text>
      </ConfirmInfoRow>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should be expandable when collapsed is true', () => {
    render(
      <ConfirmInfoRow
        label="some label"
        copyEnabled
        copyText="dummy text"
        collapsed
      >
        <Text>Some text</Text>
      </ConfirmInfoRow>,
    );
    expect(screen.queryByText('Some text')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sectionCollapseButton'));
    expect(screen.queryByText('Some text')).toBeInTheDocument();
  });

  it('should position buttons correctly when both copy and collapse are enabled', () => {
    const { container } = render(
      <ConfirmInfoRow
        label="some label"
        copyEnabled
        copyText="dummy text"
        collapsed
      >
        <Text>Some text</Text>
      </ConfirmInfoRow>,
    );

    const copyButton = container.querySelector('[aria-label="copy-button"]');
    const collapseButton = container.querySelector(
      '[aria-label="collapse-button"]',
    );

    expect(copyButton).toBeInTheDocument();
    expect(collapseButton).toBeInTheDocument();

    // Verify buttons have proper spacing (copy button at right: 36px, collapse at right: 8px)
    expect(copyButton).toHaveStyle({ right: '36px' });
    expect(collapseButton).toHaveStyle({ right: '8px' });
  });

  it('should match snapshot for Small rowVariant', () => {
    const { container } = render(
      <ConfirmInfoRow
        label="Transaction Fee"
        rowVariant={ConfirmInfoRowSize.Small}
      >
        <Text>$0.50</Text>
      </ConfirmInfoRow>,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('ConfirmInfoRowSkeleton', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoRowSkeleton data-testid="test-skeleton" />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with data-testid', () => {
    render(<ConfirmInfoRowSkeleton data-testid="my-skeleton" />);
    expect(screen.getByTestId('my-skeleton')).toBeInTheDocument();
  });
});
