import React from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';

import {
  BorderStyle,
  BlockSize,
  Size,
  BorderColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import Box from '../box';
import { RESIZE } from './textarea.constants';

/**
 * @deprecated `<TextArea />` has been deprecated in favor of the `<Textarea />`
 * component in ./ui/components/component-library/textarea/textarea.tsx.
 * See storybook documentation for BannerAlert here:
 * {@see {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-textarea--default-story#textarea}}
 *
 * Help to replace `<TextArea />` with `<Textarea />` by submitting a PR
 */

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
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderDefault}
      borderRadius={Size.SM}
      borderStyle={BorderStyle.solid}
      padding={4}
      width={BlockSize.Full}
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
