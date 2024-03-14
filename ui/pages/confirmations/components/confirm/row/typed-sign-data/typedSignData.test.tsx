import React from 'react';
import { unapprovedTypedSignMsg } from '../../../../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../../store/store';
import { ConfirmInfoRowTypedSignData } from './typedSignData';

describe('ConfirmInfoRowTypedSignData', () => {
  const render = (data: string = unapprovedTypedSignMsg.msgParams.data) => {
    const store = configureStore({
      metamask: { ...mockState.metamask },
    });

    return renderWithProvider(
      <ConfirmInfoRowTypedSignData data={data} />,
      store,
    );
  };

  it('should match snapshot', () => {
    const { container } = render(unapprovedTypedSignMsg.msgParams.data);
    expect(container).toMatchSnapshot();
  });

  it('should return null if data is not defined', () => {
    const { container } = render('');
    expect(container).toBeEmptyDOMElement();
  });
});
