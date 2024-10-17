import React from 'react';
import { render } from '@testing-library/react';
import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import { TypedSignDataV1Type } from '../../../../types/confirm';
import { ConfirmInfoRowTypedSignDataV1 } from './typedSignDataV1';

const CHAIN_ID_MOCK = '0x123';

describe('ConfirmInfoRowTypedSignData', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoRowTypedSignDataV1
        data={unapprovedTypedSignMsgV1.msgParams?.data as TypedSignDataV1Type}
        chainId={CHAIN_ID_MOCK}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = render(
      <ConfirmInfoRowTypedSignDataV1
        data={undefined}
        chainId={CHAIN_ID_MOCK}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
