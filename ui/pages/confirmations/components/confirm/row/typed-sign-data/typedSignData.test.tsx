import React from 'react';
import { unapprovedTypedSignMsgV3 } from '../../../../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../../store/store';
import { ConfirmInfoRowTypedSignData } from './typedSignData';

describe('ConfirmInfoRowTypedSignData', () => {
  const renderWithComponentData = (
    data: string = unapprovedTypedSignMsgV3.msgParams.data,
  ) => {
    const store = configureStore({
      metamask: { ...mockState.metamask },
    });

    return renderWithProvider(
      <ConfirmInfoRowTypedSignData data={data} />,
      store,
    );
  };

  it('should match snapshot', () => {
    const { container } = renderWithComponentData(
      unapprovedTypedSignMsgV3.msgParams.data,
    );
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = renderWithComponentData('');
    expect(container).toBeEmptyDOMElement();
  });
});
