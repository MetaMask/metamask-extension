import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import { useLocation } from 'react-router-dom';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import type { BoxProps } from '@metamask/design-system-react';
import { hideAppHeader } from '../../../../pages/routes/utils';

type PageProps = Omit<BoxProps, 'children'> & {
  /**
   * Elements that go in the page footer
   */
  children: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the footer
   */
  className?: string;
};

export const Page = ({ children, className = '', ...props }: PageProps) => {
  const location = useLocation();
  const hasAppHeader = location?.pathname ? !hideAppHeader({ location }) : true;

  const classNames = classnames('multichain-page', {
    'multichain-page--has-app-header': hasAppHeader,
  });

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className={`${classNames} w-full h-full`}
      data-testid="multichain-page"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        className={classnames(
          'multichain-page__inner-container w-full h-full',
          className,
        )}
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
