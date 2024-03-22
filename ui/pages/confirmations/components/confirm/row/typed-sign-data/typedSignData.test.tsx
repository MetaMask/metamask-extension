import React from 'react';
import {
  rawMessageV4,
  unapprovedTypedSignMsgV4,
} from '../../../../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../../store/store';
import { ConfirmInfoRowTypedSignData } from './typedSignData';

describe('ConfirmInfoRowTypedSignData', () => {
  const renderWithComponentData = (
    data: string = unapprovedTypedSignMsgV4.msgParams.data,
  ) => {
    const store = configureStore(mockState);

    return renderWithProvider(
      <ConfirmInfoRowTypedSignData data={data} />,
      store,
    );
  };

  it('should match snapshot', () => {
    const { container } = renderWithComponentData(
      unapprovedTypedSignMsgV4.msgParams.data,
    );
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = renderWithComponentData('');
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render data whose type is not defined', () => {
    (rawMessageV4.message as any).do_not_display = 'one';
    (rawMessageV4.message as any).do_not_display_2 = {
      do_not_display: 'two',
    };
    unapprovedTypedSignMsgV4.msgParams.data = JSON.stringify(rawMessageV4);
    const { queryByText } = renderWithComponentData(
      unapprovedTypedSignMsgV4.msgParams.data,
    );

    expect(queryByText('do_not_display')).not.toBeInTheDocument();
    expect(queryByText('one')).not.toBeInTheDocument();
    expect(queryByText('do_not_display_2')).not.toBeInTheDocument();
    expect(queryByText('two')).not.toBeInTheDocument();
  });
});
