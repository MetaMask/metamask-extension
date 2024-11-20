import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmInfoExpandableRow } from './expandable-row';

describe('ConfirmInfoExpandableRow', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoExpandableRow label="Expandable Row" content="Hidden Content">
        Expandable Value
      </ConfirmInfoExpandableRow>,
    );

    expect(container).toMatchSnapshot();
  });
});
