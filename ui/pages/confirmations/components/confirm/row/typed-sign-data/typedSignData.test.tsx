import React from 'react';
import {
  rawMessageV4,
  unapprovedTypedSignMsgV4,
} from '../../../../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../../store/store';
import { ConfirmInfoRowTypedSignData } from './typedSignData';

const CHAIN_ID_MOCK = '0x123';

describe('ConfirmInfoRowTypedSignData', () => {
  const renderWithComponentData = (
    data = unapprovedTypedSignMsgV4.msgParams?.data as string,
  ) => {
    const store = configureStore(mockState);

    return renderWithProvider(
      <ConfirmInfoRowTypedSignData data={data} chainId={CHAIN_ID_MOCK} />,
      store,
    );
  };

  it('should match snapshot', () => {
    const { container } = renderWithComponentData(
      unapprovedTypedSignMsgV4.msgParams?.data as string,
    );
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = renderWithComponentData('');
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render data whose type is not defined', () => {
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRawMessageV4 = { ...rawMessageV4 } as any;

    mockRawMessageV4.message.do_not_display = 'one';
    mockRawMessageV4.message.do_not_display_2 = {
      do_not_display: 'two',
    };

    const mockV4MsgParamsData = JSON.stringify(mockRawMessageV4);
    const { queryByText } = renderWithComponentData(mockV4MsgParamsData);

    expect(queryByText('do_not_display')).not.toBeInTheDocument();
    expect(queryByText('one')).not.toBeInTheDocument();
    expect(queryByText('do_not_display_2')).not.toBeInTheDocument();
    expect(queryByText('two')).not.toBeInTheDocument();
  });
});
