import React from 'react';
import mockState from '../../../../test/data/mock-state.json';

import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest';
import { BadgeStatus } from './badge-status';

describe('Badge Status', () => {
  const render = (props = {}, state = {}) => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        ...state,
      },
    });
    const DEFAULT_PROPS = {
      badgeBackgroundColor: BackgroundColor.backgroundDefault,
      badgeBorderColor: BorderColor.successDefault,
      isConnectedAndNotActive: true,
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      text: 'Not Connected',
    };
    return renderWithProvider(
      <BadgeStatus {...DEFAULT_PROPS} {...props} />,
      store,
    );
  };
  it('should render correctly', () => {
    const { container } = render({}, { useBlockie: true });
    expect(container).toMatchSnapshot();
  });
});
