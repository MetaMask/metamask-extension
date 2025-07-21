import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import ConfirmPage from '../confirm';

export const CONFIRM_PAGE_DECORATOR = [
  (story: () => React.ReactFragment) => {
    return <div style={{ height: '600px' }}>{story()}</div>;
  },
];

export const ARG_TYPES_SIGNATURE = {
  msgParams: {
    control: 'object',
    description: '(non-param) overrides currentConfirmation.msgParams',
  },
};

export function ConfirmStoryTemplate(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metamaskState: any = {},
): JSX.Element {
  const store = configureStore({
    ...metamaskState,
    metamask: {
      ...metamaskState.metamask,
      useTransactionSimulations: true,
    },
  });

  return (
    <Provider store={store}>
      <ConfirmPage />
    </Provider>
  );
}

export function SignatureStoryTemplate(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metamaskState: any = {},
): JSX.Element {
  return ConfirmStoryTemplate(metamaskState);
}
