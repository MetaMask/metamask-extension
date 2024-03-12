import React from 'react';
import { render } from '@testing-library/react';

import { unapprovedTypedSignMsg } from '../../../../../../../test/data/confirmations/typed_sign';
import { ConfirmInfoRowTypedSignData } from './typedSignData';

describe('ConfirmInfoRowTypedSignData', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoRowTypedSignData
        data={unapprovedTypedSignMsg.msgParams.data}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = render(<ConfirmInfoRowTypedSignData data={''} />);
    expect(container).toBeEmptyDOMElement();
  });
});
