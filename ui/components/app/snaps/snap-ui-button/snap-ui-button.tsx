import React, { MouseEvent as ReactMouseEvent } from 'react';
import classnames from 'clsx';
import { ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import {
  ButtonLinkProps,
  Icon,
  IconName,
  Text,
} from '../../../component-library';
import {
  FontWeight,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

export type SnapUIButtonProps = {
  name?: string;
  variant?: 'primary' | 'destructive';
  textVariant: ButtonLinkProps<'button'>['variant'];
  loading?: boolean;
};

const COLORS = {
  primary: TextColor.infoDefault,
  destructive: TextColor.errorDefault,
  disabled: TextColor.textMuted,
};

export const SnapUIButton = ({
  name,
  children,
  type = ButtonType.Button,
  variant: variantProp,
  disabled = false,
  loading = false,
  className = '',
  textVariant,
  ...props
}: React.PropsWithChildren<
  SnapUIButtonProps & Omit<ButtonLinkProps<'button'>, 'variant'>
>) => {
  const variant: 'primary' | 'destructive' = variantProp ?? 'primary';

  const { handleEvent } = useSnapInterfaceContext();

  const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (type === ButtonType.Button) {
      event.preventDefault();
    }

    handleEvent({
      event: UserInputEventType.ButtonClickEvent,
      name,
    });
  };

  const overriddenVariant = disabled ? 'disabled' : variant;

  const color = COLORS[overriddenVariant];

  return (
    <Text
      className={classnames(className, 'snap-ui-renderer__button', {
        'snap-ui-renderer__button--disabled': disabled,
      })}
      as="button"
      id={name}
      type={type}
      fontWeight={FontWeight.Medium}
      onClick={handleClick}
      color={color}
      disabled={disabled}
      variant={textVariant}
      {...props}
    >
      {loading ? (
        <Icon
          name={IconName.Loading}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      ) : (
        children
      )}
    </Text>
  );
};
