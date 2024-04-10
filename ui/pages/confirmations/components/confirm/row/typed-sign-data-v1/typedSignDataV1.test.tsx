import React from 'react';
import { render } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { ConfirmInfoRowTypedSignDataV1 } from './typedSignDataV1';

describe('ConfirmInfoRowTypedSignData', () => {
  it('should match snapshot', () => {
    const newMockState = {
      ...mockState,
      confirm: {
        currentConfirmation: unapprovedTypedSignMsgV1,
      },
    };
    const mockStore = configureMockStore([])(newMockState);
    const { container } = renderWithProvider(
      <ConfirmInfoRowTypedSignDataV1
        data={unapprovedTypedSignMsgV1.msgParams.data}
      />,
      mockStore,
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
