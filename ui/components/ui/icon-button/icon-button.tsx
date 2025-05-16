import React, { forwardRef } from 'react';
import classNames from 'classnames';
import { Text, ButtonBase } from '../../component-library';
import type { ButtonBaseProps } from '../../component-library/button-base/button-base.types';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip/tooltip';

export type IconButtonProps = ButtonBaseProps<'button'> & {
  onClick: () => void;
  Icon: React.ReactNode;
  label: string;
  className?: string;
  tooltipRender?: (content: React.ReactElement) => React.ReactElement;
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      onClick,
      Icon,
      disabled = false,
      label,
      className = '',
      tooltipRender,
      ...props
    },
    ref,
  ) => {
    const buttonContent = (
      <ButtonBase
        className={classNames('icon-button', className)}
        onClick={onClick}
        disabled={disabled}
        ref={ref}
        display={Display.InlineFlex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        paddingTop={3}
        paddingBottom={3}
        paddingLeft={1}
        paddingRight={1}
        textProps={{
          ellipsis: true,
          className: 'icon-button__label',
        }}
        {...props}
      >
        {Icon}
        {label.length > 10 ? (
          <Tooltip title={label} position="bottom">
            <Text
              as="span"
              display={Display.Block}
              variant={TextVariant.bodySmMedium}
              ellipsis
            >
              {label}
            </Text>
          </Tooltip>
        ) : (
          <Text
            as="span"
            display={Display.Block}
            variant={TextVariant.bodySmMedium}
            ellipsis
          >
            {label}
          </Text>
        )}
      </ButtonBase>
    );

    return tooltipRender ? tooltipRender(buttonContent) : buttonContent;
  },
);

IconButton.displayName = 'IconButton';

export default IconButton;
