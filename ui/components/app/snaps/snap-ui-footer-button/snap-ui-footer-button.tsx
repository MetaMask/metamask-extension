import React, { MouseEvent as ReactMouseEvent } from 'react';
import { ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import type { ButtonProps as SnapButtonProps } from '@metamask/snaps-sdk/jsx';
import { useSelector } from 'react-redux';
import classnames from 'clsx';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import type { ButtonProps } from '@metamask/design-system-react';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import { SnapIcon } from '../snap-icon';
import { getHideSnapBranding } from '../../../../selectors';

type SnapUIFooterButtonProps = {
  name?: string;
  loading?: boolean;
  variant?: ButtonVariant;
  snapVariant?: SnapButtonProps['variant'];
  isSnapAction?: boolean;
  onCancel?: () => void;
};

export const SnapUIFooterButton = ({
  onCancel,
  name,
  children,
  disabled = false,
  loading = false,
  isSnapAction = false,
  type = ButtonType.Button,
  variant = ButtonVariant.Primary,
  snapVariant,
  form,
  textVariant,
  ...props
}: React.PropsWithChildren<
  SnapUIFooterButtonProps & ButtonProps & { textVariant?: TextVariant }
>) => {
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
        'snap-ui-renderer__footer-button--primary':
          buttonVariant === ButtonVariant.Primary,
        'snap-ui-renderer__footer-button--secondary':
          buttonVariant === ButtonVariant.Secondary,
        'snap-ui-renderer__footer-button--danger':
          snapVariant === 'destructive',
        'hide-snap-branding': hideSnapBranding,
      })}
      type={type}
      form={form}
      {...props}
      size={ButtonSize.Lg}
      isFullWidth
      disabled={disabled}
      variant={buttonVariant}
      onClick={handleClick}
      data-testid={`${name}-snap-footer-button`}
      data-theme={null}
      isDanger={snapVariant === 'destructive'}
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
