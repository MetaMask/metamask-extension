import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import { TypedSignDataV1Type } from '../../../../types/confirm';
import { ConfirmInfoRowTypedSignDataV1 } from './typedSignDataV1';

const mockStore = configureMockStore([])(mockState);

describe('ConfirmInfoRowTypedSignData', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ConfirmInfoRowTypedSignDataV1
        data={unapprovedTypedSignMsgV1.msgParams?.data as TypedSignDataV1Type}
      />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = renderWithProvider(
      <ConfirmInfoRowTypedSignDataV1 data={undefined} />,
      mockStore,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
