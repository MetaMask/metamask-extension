import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Text } from '../../../../component-library';
import { ConfirmInfoRow } from './row';

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

  it('should be expandable when collapsible is true', () => {
    render(
      <ConfirmInfoRow
        label="some label"
        copyEnabled
        copyText="dummy text"
        collapsible
      >
        <Text>Some text</Text>
      </ConfirmInfoRow>,
    );
    expect(screen.queryByText('Some text')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sectionCollapsibleButton'));
    expect(screen.queryByText('Some text')).toBeInTheDocument();
  });
});
