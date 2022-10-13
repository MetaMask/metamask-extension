import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { Text } from '../text';
import {
  ALIGN_ITEMS,
  COLORS,
  JUSTIFY_CONTENT,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';
import { AvatarFavicon } from '../avatar-favicon';
import { ButtonBase } from '../button-base';

export const TagUrl = ({
  label,
  className,
  imageSource,
  cta,
  buttonProps,
  ...props
}) => {
  return (
    <Box
      className={classnames('tag-url', className)}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderColor={COLORS.BORDER_DEFAULT}
      borderWidth={1}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      borderRadius={SIZES.XL}
      {...props}
    >
      <AvatarFavicon className="tag-url__favicon" imageSource={imageSource} />
      <Text className="tag-url__label" variant={TEXT.BODY_MD}>
        {label}
      </Text>
      {/* Going to replace this when ButtonLink will be merged */}
      {cta && Object.keys(cta).length > 0 && (
        <ButtonBase
          className="tag-url__button-link"
          as="a"
          href="#"
          {...buttonProps}
        >
          {cta.label}
        </ButtonBase>
      )}
    </Box>
  );
};

TagUrl.propTypes = {
  /**
   * The imageSource accepts the string of the image to be rendered
   */
  imageSource: PropTypes.string,
  /**
   * The text content of the TagUrl component
   */
  label: PropTypes.string,
  /**
   * If we want a button in out Tag Url component.
   */
  cta: PropTypes.object,
  /**
   * It accepts all the props from ButtonBase
   */
  buttonProps: PropTypes.shape(ButtonBase.PropTypes),
  /**
   * Additional classNames to be added to the TagUrl component
   */
  className: PropTypes.string,
};

export default TagUrl;
