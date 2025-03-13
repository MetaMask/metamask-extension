import React from 'react';
import classnames from 'classnames';
import { HeaderBase, Text } from '../../../../../component-library';
import {
  BlockSize,
  Display,
  TextAlign,
  TextVariant,
  JustifyContent,
} from '../../../../../../helpers/constants/design-system';

import type { StyleUtilityProps } from '../../../../../component-library/box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface HeaderProps extends StyleUtilityProps {
  /**
   * Elements that go in the page footer
   */
  children?: React.ReactNode | React.ReactNode[];
  /**
   * Elements that go in the header end accessory
   */
  endAccessory?: React.ReactNode | React.ReactNode[];
  /**
   * Elements that go in the header start accessory
   */
  startAccessory?: React.ReactNode | React.ReactNode[];
  /**
   * Additional CSS class provided to the footer
   */
  className?: string;
  /**
   * Additional props to pass to the text
   */
  textProps?: React.ComponentProps<typeof Text>;
}

export const Header = ({
  children,
  endAccessory = null,
  startAccessory = null,
  className = '',
  textProps,
  ...props
}: HeaderProps) => {
  return (
    <HeaderBase
      padding={4}
      width={BlockSize.Full}
      justifyContent={JustifyContent.center}
      className={classnames('multichain-page-header', className)}
      startAccessory={startAccessory}
      endAccessory={endAccessory}
      {...props}
    >
      <Text
        display={Display.Block}
        variant={TextVariant.bodyMdBold}
        textAlign={TextAlign.Center}
        paddingInlineStart={8}
        paddingInlineEnd={8}
        ellipsis
        {...textProps}
      >
        {children}
      </Text>
    </HeaderBase>
  );
};
