import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { Box } from '../box';
import { Text } from '../text';

export const Tag = ({ label, className, labelProps, ...props }) => {
  return (
    <Box
      className={classnames('mm-tag', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      display={Display.InlineFlex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
      paddingLeft={1}
      paddingRight={1}
      {...props}
    >
      <Text variant={TextVariant.bodySm} {...labelProps}>
        {label}
      </Text>
    </Box>
  );
};

Tag.propTypes = {
  /**
   * The text content of the Tag component
   */
  label: PropTypes.node,
  /**
   * The label props of the component. Most Text component props can be used
   */
  labelProps: PropTypes.shape(Text.PropTypes),
  /**
   * Additional classNames to be added to the Tag component
   */
  className: PropTypes.string,
  /**
   * Tag also accepts all props from Box
   */
  ...Box.propTypes,
};
