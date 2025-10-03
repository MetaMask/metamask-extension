import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { EstimatedChanges } from './estimated-changes';

jest.mock('../../../../../../components/app/name/name', () => ({
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ value }: { value: string }) => <span>{value}</span>,
}));

describe('EstimatedChanges', () => {
  it('renders monthly plan correctly with tooltip', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <EstimatedChanges
        approvalAmount={'96'}
        tokenAddress={'0xToken'}
        chainId={'0x5'}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders annual plan correctly without tooltip', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <EstimatedChanges
        approvalAmount={'80'}
        tokenAddress={'0xToken'}
        chainId={'0x5'}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
