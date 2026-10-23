import React from 'react';
import {
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
} from '@metamask/design-system-react';

export type PerpsSectionHeaderProps = {
  label: string;
  onClick: () => void;
  'data-testid'?: string;
  'aria-label'?: string;
};

/**
 * Clickable section header on the Perps tab: label, right-pointing arrow,
 * hover and pressed states.
 *
 * `ButtonBase` stands in for the SectionHeader primitive the design system
 * lacks, and supplies the button role and keyboard activation.
 *
 * @param options0 - Component props
 * @param options0.label - Section title shown on the left
 * @param options0.onClick - Invoked on click and on keyboard activation
 * @param options0.'data-testid' - Test id forwarded to the button
 * @param options0.'aria-label' - Overrides the accessible name
 */
export const PerpsSectionHeader = ({
  label,
  onClick,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
}: PerpsSectionHeaderProps) => (
  <ButtonBase
    className="w-full flex flex-row justify-between items-center px-4 py-3 bg-transparent rounded-none hover:bg-hover active:bg-pressed"
    onClick={onClick}
    data-testid={dataTestId}
    aria-label={ariaLabel}
  >
    <Text fontWeight={FontWeight.Medium}>{label}</Text>
    <Icon
      name={IconName.ArrowRight}
      size={IconSize.Sm}
      color={IconColor.IconAlternative}
    />
  </ButtonBase>
);

export default PerpsSectionHeader;
