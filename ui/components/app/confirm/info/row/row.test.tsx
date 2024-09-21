import React from 'react';
import { render } from '@testing-library/react';

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
});
