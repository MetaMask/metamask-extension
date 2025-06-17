import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import Identicon from '../../../ui/identicon';
import { Icon, IconSize, IconName } from '../../../component-library';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import {
  TrustSignalDisplayState,
  TrustSignalResult,
} from '../../../../hooks/useTrustSignals';
import {
  getTrustSignalIcon,
  getTrustSignalCssClasses,
} from '../../../../helpers/utils/trust-signals';
import ShortenedName from './shortened-name';
import FormattedName from './formatted-value';

export type NameDisplayProps = {
  preferContractSymbol?: boolean;
  value: string;
  type: NameType;
  variation: string;
  handleClick?: () => void;
  trustSignal?: TrustSignalResult | null;
};

function doesHaveDisplayName(name: string | null): name is string {
  return Boolean(name);
}

const NameDisplay = memo(
  ({
    value,
    type,
    preferContractSymbol,
    variation,
    handleClick,
    trustSignal,
  }: NameDisplayProps) => {
    const { name, hasPetname, image } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const hasDisplayName = doesHaveDisplayName(name);

    // Get icon properties from trust signal
    const iconProps = trustSignal
      ? getTrustSignalIcon(trustSignal.state)
      : null;

    // Get CSS classes from trust signal
    const cssClasses = getTrustSignalCssClasses(trustSignal?.state, {
      hasPetname,
      hasDisplayName,
      isClickable: Boolean(handleClick),
    }).join(' ');

    const renderIcon = () => {
      // Special case: Warning state always shows Identicon
      if (trustSignal?.state === TrustSignalDisplayState.Warning) {
        return <Identicon address={value} diameter={16} image={image} />;
      }

      // Trust signal icon takes precedence (for non-warning states)
      if (iconProps) {
        return (
          <Icon
            name={iconProps.name}
            className="name__icon"
            size={IconSize.Md}
            color={iconProps.color}
          />
        );
      }

      // If we have a display name or petname, show Identicon
      if (hasDisplayName || hasPetname) {
        return <Identicon address={value} diameter={16} image={image} />;
      }

      // No name and no trust signal = Question icon (unknown address)
      return (
        <Icon
          name={IconName.Question}
          className="name__icon"
          size={IconSize.Md}
        />
      );
    };

    // Determine what name to display based on priority
    const getDisplayName = () => {
      // Priority 1: Petname (user's saved name)
      if (hasPetname && name) {
        return <ShortenedName name={name} />;
      }

      // Priority 2: Trust label (from security alert)
      if (trustSignal?.trustLabel) {
        return <ShortenedName name={trustSignal.trustLabel} />;
      }

      // Priority 3: Recognized name from name providers
      if (hasDisplayName && name) {
        return <ShortenedName name={name} />;
      }

      // Priority 4: Formatted address
      return <FormattedName value={value} type={type} />;
    };

    return (
      <div className={cssClasses} onClick={handleClick}>
        {renderIcon()}
        {getDisplayName()}
      </div>
    );
  },
);

export default NameDisplay;
