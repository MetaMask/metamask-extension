import React, { type ReactNode } from 'react';
import {
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ASSET_CELL_HEIGHT } from '../constants';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type LowValueAssetsToggleProps = {
  count: number;
  isExpanded: boolean;
  onClick: () => void;
  /**
   * Control rendered under the label, in the same row. Kept outside the expand
   * button so the two controls are not nested.
   */
  trailing?: ReactNode;
};

export const LowValueAssetsToggle = ({
  count,
  isExpanded,
  onClick,
  trailing,
}: LowValueAssetsToggleProps) => {
  const t = useI18nContext();

  const label = (
    <Text
      variant={TextVariant.BodyMd}
      fontWeight={FontWeight.Medium}
      color={TextColor.TextAlternative}
      ellipsis
      className="min-w-0"
    >
      {t('lowValueAssets', [count])}
    </Text>
  );
  const chevron = (
    <Icon
      name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
      size={IconSize.Sm}
      color={IconColor.IconAlternative}
      className="shrink-0"
    />
  );

  if (!trailing) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between bg-background-default px-4 text-start text-inherit hover:bg-hover focus:outline-none"
        style={{ height: ASSET_CELL_HEIGHT }}
        aria-expanded={isExpanded}
        data-testid="low-value-assets-toggle"
      >
        {label}
        {chevron}
      </button>
    );
  }

  return (
    <div
      className="flex w-full items-center gap-2 bg-background-default px-4 hover:bg-hover"
      style={{ height: ASSET_CELL_HEIGHT }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <button
          type="button"
          onClick={onClick}
          className="m-0 flex w-full min-w-0 items-center border-0 bg-transparent p-0 text-start text-inherit focus:outline-none"
          aria-expanded={isExpanded}
          data-testid="low-value-assets-toggle"
        >
          {label}
        </button>
        <div className="flex min-w-0">{trailing}</div>
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClick}
        className="m-0 flex shrink-0 items-center border-0 bg-transparent p-0 text-inherit focus:outline-none"
      >
        {chevron}
      </button>
    </div>
  );
};
