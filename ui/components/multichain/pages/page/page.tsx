import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useLocation } from 'react-router-dom-v5-compat';
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

  const classNames = classnames('multichain-page', {
    'multichain-page--has-app-header': hasAppHeader,
  });

  return (
    <Box
      width={BlockSize.Full}
      height={BlockSize.Full}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      className={classNames}
      data-testid="multichain-page"
    >
      <Box
        width={BlockSize.Full}
        height={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        backgroundColor={BackgroundColor.backgroundDefault}
        className={classnames('multichain-page__inner-container', className)}
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
