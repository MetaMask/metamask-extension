import React, { memo } from 'react';
import { NameType } from '@metamask/name-controller';
import Identicon from '../../../ui/identicon';
import { Icon, IconSize } from '../../../component-library';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
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
  trustSignalDisplayState?: TrustSignalDisplayState;
  trustLabel?: string | null;
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
    trustSignalDisplayState,
    trustLabel,
  }: NameDisplayProps) => {
    const { name, hasPetname, image } = useDisplayName({
      value,
      type,
      preferContractSymbol,
      variation,
    });

    const hasDisplayName = doesHaveDisplayName(name);

    // Get icon properties from utility function
    const iconProps = trustSignalDisplayState
      ? getTrustSignalIcon(trustSignalDisplayState)
      : null;

    // Get CSS classes from utility function
    const cssClasses = getTrustSignalCssClasses(
      trustSignalDisplayState || TrustSignalDisplayState.Unknown,
      {
        hasPetname,
        hasDisplayName,
        isClickable: Boolean(handleClick),
      },
    ).join(' ');

    const renderIcon = () => {
      if (!iconProps) {
        // Show identicon for states that don't have an icon (Warning, Petname, Recognized)
        return <Identicon address={value} diameter={16} image={image} />;
      }

      return (
        <Icon
          name={iconProps.name}
          className="name__icon"
          size={IconSize.Md}
          color={iconProps.color}
        />
      );
    };

    // Determine what name to display based on priority
    const getDisplayContent = () => {
      // Priority 1: Petname (user's saved name)
      if (hasPetname && name) {
        return <ShortenedName name={name} />;
      }

      // Priority 2: Trust label (from security alert)
      if (trustLabel) {
        return <ShortenedName name={trustLabel} />;
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
        {getDisplayContent()}
      </div>
    );
  },
);

export default NameDisplay;
