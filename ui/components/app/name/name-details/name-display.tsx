import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import { AvatarAccountSize } from '@metamask/design-system-react';
import classnames from 'classnames';
import Identicon from '../../../ui/identicon';
import { Icon, IconSize, Text } from '../../../component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { PreferredAvatar } from '../../preferred-avatar';
import ShortenedName from './shortened-name';
import FormattedName from './formatted-value';

export type NameDisplayProps = {
  preferContractSymbol?: boolean;
  value: string;
  type: NameType;
  variation: string;
  handleClick?: () => void;
  showFullName?: boolean;
};

const NameDisplay = memo(
  ({
    value,
    type,
    preferContractSymbol,
    variation,
    handleClick,
    showFullName = false,
  }: NameDisplayProps) => {
    const { name, image, icon, displayState } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const renderIcon = () => {
      // If icon exists, use it (trust signal /unknown)
      if (icon) {
        return (
          <Icon
            name={icon.name}
            className="name__icon"
            size={IconSize.Md}
            color={icon.color}
          />
        );
      }

      if (image) {
        return <Identicon address={value} diameter={16} image={image} />;
      }

      return <PreferredAvatar address={value} size={AvatarAccountSize.Xs} />;
    };

    const renderName = () => {
      if (!name) {
        return <FormattedName value={value} type={type} />;
      }

      if (showFullName) {
        return (
          <Text className="name__name" variant={TextVariant.bodyMd}>
            {name}
          </Text>
        );
      }

      return <ShortenedName name={name} />;
    };

    return (
      <div
        className={classnames({
          name: true,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__clickable: Boolean(handleClick),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__saved: displayState === TrustSignalDisplayState.Petname,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__recognized_unsaved:
            displayState === TrustSignalDisplayState.Recognized,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__missing: displayState === TrustSignalDisplayState.Unknown,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__malicious: displayState === TrustSignalDisplayState.Malicious,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__verified: displayState === TrustSignalDisplayState.Verified,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__warning: displayState === TrustSignalDisplayState.Warning,
        })}
        onClick={handleClick}
      >
        {renderIcon()}
        {renderName()}
      </div>
    );
  },
);

export default NameDisplay;
