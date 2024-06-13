import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep } from 'lodash';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import ConfirmPage from '../../confirm';
import { SignatureRequestType } from '../../../types/confirm';

export const ARG_TYPES_SIGNATURE = {
  msgParams: {
    control: 'object',
    description: '(non-param) overrides currentConfirmation.msgParams',
  },
};

export const CONFIRM_PAGE_DECORATOR = [
  (story: () => React.ReactFragment) => {
    return <div style={{ height: '600px' }}>{story()}</div>;
  },
];

export function SignatureStoryTemplate(
  args: { msgParams: SignatureRequestType['msgParams'] },
  confirmation: SignatureRequestType,
): JSX.Element {
  const mockConfirmation = cloneDeep(confirmation) as SignatureRequestType;
  mockConfirmation.msgParams = args.msgParams;

  const store = configureStore({
    confirm: {
      currentConfirmation: mockConfirmation,
    },
    metamask: { ...mockState.metamask },
  });

  return (
    <Provider store={store}>
      <ConfirmPage />
    </Provider>
  );
}
