import { render } from '@testing-library/react';
import React from 'react';

import { ConfirmInfo, ConfirmInfoRowConfig, ConfirmInfoRowType } from './info';

const mockRowConfigs: ConfirmInfoRowConfig[] = [
  {
    label: 'Address',
    variant: ConfirmInfoRowType.Address,
    rowProps: {
      address: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
  },
  {
    variant: ConfirmInfoRowType.Divider,
  },
  {
    label: 'Account',
    variant: ConfirmInfoRowType.ValueDouble,
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

  it('should render the correct number of rows provided', () => {
    const { container } = render(<ConfirmInfo rowConfigs={mockRowConfigs} />);
    const numOfDividers = mockRowConfigs.filter(
      (rowConfig) => rowConfig.variant === ConfirmInfoRowType.Divider,
    ).length;

    expect(container.querySelectorAll('.confirm-info-row')).toHaveLength(
      mockRowConfigs.length - numOfDividers,
    );
  });
});
