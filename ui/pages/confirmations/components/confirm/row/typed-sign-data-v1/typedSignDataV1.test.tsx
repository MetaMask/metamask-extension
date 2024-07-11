import React from 'react';
import { render } from '@testing-library/react';

import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import { ConfirmInfoRowTypedSignDataV1 } from './typedSignDataV1';

describe('ConfirmInfoRowTypedSignData', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoRowTypedSignDataV1
        data={unapprovedTypedSignMsgV1.msgParams.data}
      />,
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
