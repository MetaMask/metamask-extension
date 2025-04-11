import {
  ButtonType,
  ButtonVariant,
  UserInputEventType,
} from '@metamask/snaps-sdk';
import type { ButtonProps as SnapButtonProps } from '@metamask/snaps-sdk/jsx';
import classnames from 'classnames';
import type { FunctionComponent, MouseEvent as ReactMouseEvent } from 'react';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useSelector } from 'react-redux';

import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { getHideSnapBranding } from '../../../../selectors';
import type { ButtonProps } from '../../../component-library';
import {
  Button,
  ButtonSize,
  Icon,
  IconName,
  IconSize,
} from '../../../component-library';
import { SnapIcon } from '../snap-icon';

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

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
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
