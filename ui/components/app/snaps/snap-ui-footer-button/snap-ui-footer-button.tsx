import React, { FunctionComponent, MouseEvent as ReactMouseEvent } from 'react';
import {
  ButtonType,
  ButtonVariant,
  UserInputEventType,
} from '@metamask/snaps-sdk';
import type { ButtonProps as SnapButtonProps } from '@metamask/snaps-sdk/jsx';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  Button,
  ButtonProps,
  ButtonSize,
  Icon,
  IconName,
  IconSize,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { SnapIcon } from '../snap-icon';
import { getHideSnapBranding } from '../../../../selectors';

type SnapUIFooterButtonProps = {
  name?: string;
  variant?: ButtonVariant;
  snapVariant?: SnapButtonProps['variant'];
  isSnapAction?: boolean;
  onCancel?: () => void;
};

export const SnapUIFooterButton: FunctionComponent<
  SnapUIFooterButtonProps & ButtonProps<'button'>
> = ({
  onCancel,
  name,
  children,
  disabled = false,
  loading = false,
  isSnapAction = false,
  type,
  variant = ButtonVariant.Primary,
  snapVariant,
  form,
  ...props
}) => {
  const { handleEvent, snapId } = useSnapInterfaceContext();
  const hideSnapBranding = useSelector((state) =>
    getHideSnapBranding(state, snapId),
  );

  const handleSnapAction = (event: ReactMouseEvent<HTMLElement>) => {
    if (type === ButtonType.Button) {
      event.preventDefault();
    }

    handleEvent({
      event: UserInputEventType.ButtonClickEvent,
      name,
    });
  };

  const handleClick = isSnapAction ? handleSnapAction : onCancel;

  const brandedButtonVariant = isSnapAction
    ? ButtonVariant.Primary
    : ButtonVariant.Secondary;

  const buttonVariant = hideSnapBranding ? variant : brandedButtonVariant;

  return (
    <Button
      className={classnames('snap-ui-renderer__footer-button', {
        'snap-ui-renderer__footer-button--disabled': disabled,
        'hide-snap-branding': hideSnapBranding,
      })}
      type={type}
      form={form}
      {...props}
      size={ButtonSize.Lg}
      block
      disabled={disabled}
      variant={buttonVariant}
      onClick={handleClick}
      textProps={{
        display: Display.Flex,
        alignItems: AlignItems.center,
        flexDirection: FlexDirection.Row,
      }}
      data-testid={`${name}-snap-footer-button`}
      data-theme={null}
      danger={snapVariant === 'destructive'}
    >
      {isSnapAction && !hideSnapBranding && !loading && (
        <SnapIcon snapId={snapId} avatarSize={IconSize.Sm} marginRight={2} />
      )}
      {loading ? (
        <Icon
          name={IconName.Loading}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      ) : (
        children
      )}
    </Button>
  );
};
