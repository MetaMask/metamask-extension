import React from 'react';
import { render } from '@testing-library/react';

import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import { ConfirmInfoRowTypedSignDataV1 } from './typedSignDataV1';

describe('ConfirmInfoRowTypedSignData', () => {
  it('should match snapshot', () => {
    const mockData = {
      'Sign into \u202E EVIL': {
        type: 'string',
        value: 'Sign into \u202E EVIL',
      },
      'A number': { type: 'uint32', value: '1337' },
    };
    const { container } = render(
      <ConfirmInfoRowTypedSignDataV1 data={mockData} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = render(
      <ConfirmInfoRowTypedSignDataV1 data={undefined} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
