import React, { forwardRef } from 'react';
import classNames from 'classnames';
import { Text, ButtonBase } from '../../component-library';
import type { ButtonBaseProps } from '../../component-library/button-base/button-base.types';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip/tooltip';
import IconButtonRound from './icon-button-round';

export type IconButtonProps = ButtonBaseProps<'button'> & {
  onClick: () => void;
  Icon: React.ReactNode;
  label: string;
  className?: string;
  tooltipRender?: (content: React.ReactElement) => React.ReactElement;
  round?: boolean;
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
      round = true,
      ...props
    },
    ref,
  ) => {
    if (round) {
      return (
        <IconButtonRound
          onClick={onClick}
          Icon={Icon as object}
          disabled={disabled}
          label={label}
          tooltipRender={tooltipRender}
          ref={ref}
          {...props}
        />
      );
    }

    const buttonContent = (
      <ButtonBase
        className={classNames('icon-button', className)}
        onClick={onClick}
        backgroundColor={BackgroundColor.backgroundMuted}
        disabled={disabled}
        ref={ref}
        display={Display.InlineFlex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        paddingTop={3}
        paddingBottom={3}
        paddingLeft={2}
        paddingRight={2}
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
            style={{ marginTop: '-4px' }}
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
