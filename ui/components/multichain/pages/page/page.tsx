import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import { useLocation } from 'react-router-dom';
import { usePureBlack } from '@metamask/design-system-react';
import { Box } from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';

import type { StyleUtilityProps } from '../../../component-library/box';
import { hideAppHeader } from '../../../../pages/routes/utils';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface PageProps extends StyleUtilityProps {
  /**
   * Elements that go in the page footer
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the footer
   */
  className?: string;
}

export const Page = ({ children, className = '', ...props }: PageProps) => {
  const location = useLocation();
  const hasAppHeader = location?.pathname ? !hideAppHeader({ location }) : true;
  // TODO: @metamask/design-system-engineers remove isPureBlack once pure black is shipped targeted(13.43.0)
  const isPureBlack = usePureBlack();

  const classNames = classnames('multichain-page', {
    'multichain-page--has-app-header': hasAppHeader,
  });

  const backgroundColor = isPureBlack
    ? BackgroundColor.backgroundAlternative
    : BackgroundColor.backgroundDefault;

  return (
    <Box
      width={BlockSize.Full}
      height={BlockSize.Full}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      backgroundColor={backgroundColor}
      className={classNames}
      data-testid="multichain-page"
    >
      <Box
        width={BlockSize.Full}
        height={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        backgroundColor={backgroundColor}
        className={className}
        {...props}
      >
        {children}
      </Box>
    </Box>
  );
};

Page.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
