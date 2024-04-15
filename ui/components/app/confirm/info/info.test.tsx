import React from 'react';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { ConfirmInfo, ConfirmInfoRowConfig, ConfirmInfoRowType } from './info';

const mockRowConfigs: ConfirmInfoRowConfig[] = [
  {
    label: 'Address',
    type: ConfirmInfoRowType.Address,
    rowProps: {
      address: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
  },
  {
    type: ConfirmInfoRowType.Divider,
  },
  {
    label: 'Account',
    type: ConfirmInfoRowType.ValueDouble,
    rowProps: {
      left: '$834.32',
      right: '0.05 ETH',
    },
  },
];

describe('ConfirmInfo', () => {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const render = (storeOverrides: Record<string, any> = {}) => {
    const store = configureStore({
      ...mockState.metamask,
      metamask: { ...mockState.metamask },
      ...storeOverrides,
    });

    return renderWithProvider(
      <ConfirmInfo rowConfigs={mockRowConfigs} />,
      store,
    );
  };

  it('should match snapshot', () => {
    const { container } = render(mockRowConfigs);
    expect(container).toMatchSnapshot();
  });

  it('renders the correct number of rows provided', () => {
    const { container } = render(mockRowConfigs);
    const numOfDividers = mockRowConfigs.filter(
      (rowConfig) => rowConfig.type === ConfirmInfoRowType.Divider,
    ).length;

    expect(container.querySelectorAll('.confirm-info-row')).toHaveLength(
      mockRowConfigs.length - numOfDividers,
    );
  });
});
