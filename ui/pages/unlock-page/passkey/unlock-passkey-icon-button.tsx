import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ButtonIcon,
  ButtonIconVariant,
  IconName,
  ButtonIconSize,
  IconColor,
  IconSize,
} from '@metamask/design-system-react';

export type UnlockPasskeyIconButtonProps = {
  disabled: boolean;
  onClick: () => void;
};

type PasskeyIconContext = {
  t: (key: string, args?: unknown[]) => string;
};

export class UnlockPasskeyIconButton extends Component<UnlockPasskeyIconButtonProps> {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    disabled: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  render() {
    const { disabled, onClick } = this.props;
    const { t } = this.context as PasskeyIconContext;

    return (
      <ButtonIcon
        variant={ButtonIconVariant.Filled}
        ariaLabel={t('unlockWithPasskey')}
        data-testid="unlock-with-passkey"
        iconName={IconName.Fingerprint}
        size={ButtonIconSize.Lg}
        color={IconColor.IconAlternative}
        iconProps={{
          color: IconColor.IconAlternative,
          size: IconSize.Lg,
        }}
        className="flex self-start mb-4 h-12 w-12 rounded-lg"
        disabled={disabled}
        onClick={onClick}
        type="button"
      />
    );
  }
}
