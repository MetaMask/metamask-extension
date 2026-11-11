import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import {
  AvatarAccountSize,
  AvatarToken,
  AvatarTokenSize,
  Text as DsText,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import classnames from 'clsx';
import { Icon, IconSize, Text } from '../../../component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { useStartTruncatedText } from '../../../../hooks/useStartTruncatedText';
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
  /**
   * The fallback value to display if the name is not found or cannot be resolved.
   */
  fallbackName?: string;
  /**
   * Whether to disable the onClick handler.
   */
  disableNameClick?: boolean;
  /**
   * Whether to fill the available width on one line. Names are cut at the end
   * and addresses at the start, only when needed. Shows the value when only a
   * security label is known.
   */
  fillWidth?: boolean;
};

const NameDisplay = memo(
  ({
    value,
    type,
    preferContractSymbol,
    variation,
    handleClick,
    showFullName = false,
    fallbackName,
    disableNameClick,
    fillWidth = false,
    ...props
  }: NameDisplayProps) => {
    const { name, image, icon, displayState, isAccount } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const fillName =
      displayState === TrustSignalDisplayState.Unknown
        ? fallbackName
        : name || fallbackName;
    const [fillRef, fillValue] = useStartTruncatedText(value, 10);

    const renderIcon = () => {
      // If icon exists, use it (trust signal /unknown)
      if (icon) {
        return (
          <Icon
            name={icon.name}
            className="name__icon"
            size={IconSize.Sm}
            color={icon.color}
          />
        );
      }

      if (image) {
        return (
          <AvatarToken src={image} name={value} size={AvatarTokenSize.Xs} />
        );
      }

      return (
        <PreferredAvatar
          className="rounded-md"
          address={value}
          size={AvatarAccountSize.Xs}
        />
      );
    };

    const renderName = () => {
      if (fillWidth) {
        return (
          <DsText
            asChild
            className={fillName ? 'name__name' : 'name__value'}
            variant={DsTextVariant.BodyMd}
            {...props}
          >
            <p ref={fillName ? undefined : fillRef}>{fillName || fillValue}</p>
          </DsText>
        );
      }

      const nameWithFallbackValue = name || fallbackName;
      if (!nameWithFallbackValue) {
        return <FormattedName value={value} type={type} {...props} />;
      }

      if (name && showFullName) {
        return (
          <Text className="name__name" variant={TextVariant.bodyMd} {...props}>
            {name}
          </Text>
        );
      }

      return <ShortenedName name={nameWithFallbackValue} {...props} />;
    };

    return (
      <div
        className={classnames({
          name: true,
          'justify-end': fillWidth,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          name__clickable:
            Boolean(handleClick) && !isAccount && !disableNameClick,
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
