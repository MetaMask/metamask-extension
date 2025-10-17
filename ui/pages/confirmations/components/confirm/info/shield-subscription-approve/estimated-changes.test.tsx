import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { tEn } from '../../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { EstimatedChanges } from './estimated-changes';

jest.mock('../../../../../../components/app/name/name', () => ({
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ value }: { value: string }) => <span>{value}</span>,
}));

describe('EstimatedChanges', () => {
  it('renders for monthly plan correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(
      <EstimatedChanges
        approvalAmount={'96'}
        tokenAddress={'0xToken'}
        chainId={'0x5'}
      />,
      mockStore,
    );

    expect(getByText(tEn('estimatedChanges') as string)).toBeInTheDocument();
    expect(getByText(tEn('youApprove') as string)).toBeInTheDocument();
    expect(getByText('96')).toBeInTheDocument();
    expect(getByText('0xToken')).toBeInTheDocument();
  });

  it('renders for annual plan correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(
      <EstimatedChanges
        approvalAmount={'80'}
        tokenAddress={'0xToken'}
        chainId={'0x5'}
      />,
      mockStore,
    );

    expect(getByText(tEn('estimatedChanges') as string)).toBeInTheDocument();
    expect(getByText(tEn('youApprove') as string)).toBeInTheDocument();
    expect(getByText('80')).toBeInTheDocument();
    expect(getByText('0xToken')).toBeInTheDocument();
  });
});
