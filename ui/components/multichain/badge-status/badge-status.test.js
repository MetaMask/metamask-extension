import React from 'react';
import { render } from '@testing-library/react';

import {BadgeStatus} from './badge-status';
import { BackgroundColor, BorderColor } from '../../../helpers/constants/design-system';

describe('Badge Status', () => {
  const props = {
    badgeBackgroundColor: BackgroundColor.backgroundDefault,
    badgeBorderColor: BorderColor.successDefault,
    isConnectedAndNotActive: true,
    address: '0x1',
    text: 'Not Connected'
  };
  it('should render correctly', () => {
    const { getByTestId } = render(
      <BadgeStatus {...props} />,
    );
    const menuContainer = getByTestId('multichain-badge-status');
    expect(menuContainer).toBeInTheDocument();
  });
});
