import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockSetApprovalForAllConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { RevokeSetApprovalForAllStaticSimulation } from './revoke-set-approval-for-all-static-simulation';

describe('<RevokeSetApprovalForAllStaticSimulation />', () => {
  const middleware = [thunk];

  it('renders component for setApprovalForAll request', async () => {
    const state = getMockSetApprovalForAllConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const testSpender = '0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4';

    const { container } = renderWithConfirmContextProvider(
      <RevokeSetApprovalForAllStaticSimulation spender={testSpender} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
