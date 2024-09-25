import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from '../../../../store/store';
import { ConfirmContextProvider } from '../../context/confirm';
import ConfirmPage from '../confirm';

export const CONFIRM_PAGE_DECORATOR = [
  (story: () => React.ReactFragment) => {
    return (
      <ConfirmContextProvider>
        <div style={{ height: '600px' }}>{story()}</div>
      </ConfirmContextProvider>
    );
  },
];

export const ARG_TYPES_SIGNATURE = {
  msgParams: {
    control: 'object',
    description: '(non-param) overrides currentConfirmation.msgParams',
  },
};

export function ConfirmStoryTemplate(
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
      {/* Adding the MemoryRouter and Route is a workaround to bypass a 404 error in storybook that
        is caused when the 'ui/pages/confirmations/hooks/syncConfirmPath.ts' hook calls
        history.replace. To avoid history.replace, we can provide a param id. */}
      <MemoryRouter
        initialEntries={[
          `/confirmation/${
            Object.keys(metamaskState.metamask?.pendingApprovals)?.[0]
          }`,
        ]}
      >
        <Route path="/confirmation/:id" render={() => <ConfirmPage />} />
      </MemoryRouter>
    </Provider>
  );
}

export function SignatureStoryTemplate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metamaskState: any = {},
): JSX.Element {
  return ConfirmStoryTemplate(metamaskState);
}
