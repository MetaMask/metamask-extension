import React from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';

import {
  COLORS,
  RESIZE,
  SIZES,
  BORDER_STYLE,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';

import Box from '../box';

const TextArea = ({
  className,
  value,
  onChange,
  resize = RESIZE.BOTH,
  scrollable = false,
  height,
  boxProps,
  ...props
}) => {
  const textAreaClassnames = classnames(
    'textarea',
    className,
    `textarea--resize-${resize}`,
    {
      'textarea--scrollable': scrollable,
      'textarea--not-scrollable': !scrollable,
    },
  );
  return (
    <Box
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderColor={COLORS.BORDER_DEFAULT}
      borderRadius={SIZES.SM}
      borderStyle={BORDER_STYLE.SOLID}
      padding={[4, 4]}
      width={BLOCK_SIZES.FULL}
      {...boxProps}
    >
      {(boxClassName) => (
        <textarea
          required
          style={{ height }}
          className={classnames(boxClassName, textAreaClassnames)}
          {...{ value, onChange, ...props }}
        />
      )}
    </Box>
  );
};

TextArea.propTypes = {
  /**
   * The height of the Textarea component. Accepts any number, px or % value
   */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * Optional additional className to add to the Textarea component
   */
  className: PropTypes.string,
  /**
   * Value is the text of the TextArea component
   */
  value: PropTypes.string,
  /**
   * The onChange function of the textarea
   */
  onChange: PropTypes.func,
  /**
   * Resize is the resize capability of the textarea accepts all valid css values
   * Defaults to "both"
   */
  resize: PropTypes.oneOf(Object.values(RESIZE)),
  /**
   * Whether the Textarea should be scrollable. Applies overflow-y: scroll to the textarea
   * Defaults to false
   */
  scrollable: PropTypes.bool,
  /**
   * The Textarea component accepts all Box component props inside the boxProps object
   */
  boxProps: PropTypes.shape({
    ...Box.propTypes,
  }),
};

export default TextArea;
