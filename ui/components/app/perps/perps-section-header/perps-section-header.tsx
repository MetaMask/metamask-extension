import React from 'react';
import {
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';

export type PerpsSectionHeaderProps = {
  label: string;
  onClick: () => void;
  'data-testid'?: string;
  'aria-label'?: string;
};

/**
 * Clickable section header on the Perps tab: heading with the chevron
 * tucked directly after the title, matching Top movers.
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
    className="w-auto self-start h-auto justify-start gap-1 bg-transparent px-4 pt-4 rounded-none hover:bg-transparent active:bg-transparent"
    onClick={onClick}
    data-testid={dataTestId}
    aria-label={ariaLabel}
  >
    <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
      {label}
    </Text>
    <Icon
      name={IconName.ArrowRight}
      size={IconSize.Md}
      color={IconColor.IconAlternative}
    />
  </ButtonBase>
);

export default PerpsSectionHeader;
