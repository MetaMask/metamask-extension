import React from 'react';
import classnames from 'clsx';
import { HeaderBase } from '@metamask/design-system-react';
import { Text } from '../../../../../component-library';
import {
  Display,
  TextAlign,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface HeaderProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof HeaderBase>,
    'children' | 'className' | 'startAccessory' | 'endAccessory'
  > {
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
      className={classnames('multichain-page-header p-4 w-full', className)}
      startAccessory={startAccessory}
      endAccessory={endAccessory}
      {...props}
    >
      <Text
        display={Display.Block}
        variant={TextVariant.bodyMdBold}
        textAlign={TextAlign.Center}
        paddingInlineStart={2}
        paddingInlineEnd={2}
        ellipsis
        {...textProps}
      >
        {children}
      </Text>
    </HeaderBase>
  );
};
