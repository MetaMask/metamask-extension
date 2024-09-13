import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { cloneDeep } from 'lodash';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { ConfirmContextProvider } from '../../context/confirm';
import { SignatureRequestType } from '../../types/confirm';
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
    metamask: {
      ...mockState.metamask,
      ...metamaskState,
      useTransactionSimulations: true,
    },
  });

  return (
    <Provider store={store}>
      {/* Adding the MemoryRouter and Route is a workaround to bypass a 404 error in storybook that
        is caused when the 'ui/pages/confirmations/hooks/syncConfirmPath.ts' hook calls
        history.replace. To avoid history.replace, we can provide a param id. */}
      <MemoryRouter initialEntries={['/confirmation/:0']}>
        <Route path="/confirmation/:id" render={() => <ConfirmPage />} />
      </MemoryRouter>
    </Provider>
  );
}

export function SignatureStoryTemplate(
  args: { msgParams: SignatureRequestType['msgParams'] },
  confirmation: SignatureRequestType,
): JSX.Element {
  const mockConfirmation = cloneDeep(confirmation) as SignatureRequestType;
  mockConfirmation.msgParams = args.msgParams;

  return ConfirmStoryTemplate(mockConfirmation);
}
