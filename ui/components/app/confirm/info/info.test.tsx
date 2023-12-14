import { render } from '@testing-library/react';
import React from 'react';

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
  it('should match snapshot', () => {
    const { container } = render(<ConfirmInfo rowConfigs={mockRowConfigs} />);
    expect(container).toMatchSnapshot();
  });

  it('renders the correct number of rows provided', () => {
    const { container } = render(<ConfirmInfo rowConfigs={mockRowConfigs} />);
    const numOfDividers = mockRowConfigs.filter(
      (rowConfig) => rowConfig.type === ConfirmInfoRowType.Divider,
    ).length;

    expect(container.querySelectorAll('.confirm-info-row')).toHaveLength(
      mockRowConfigs.length - numOfDividers,
    );
  });
});
