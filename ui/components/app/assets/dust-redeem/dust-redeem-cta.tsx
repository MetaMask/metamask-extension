import React, { useCallback } from 'react';
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

export const DUST_REDEEM_CTA_TEST_ID = 'dust-redeem-cta';

type DustRedeemCtaProps = {
  label: string;
  onClick: () => void;
};

/**
 * Plain text button on the low balance tokens row. Matches the token-list
 * Earn CTA text: green, medium, body-sm, with no button chrome. The tag icon
 * sits to the left of the label.
 *
 * @param props - The component props.
 * @param props.label - Visible label, including the redeem amount.
 * @param props.onClick - Opens the redeem modal.
 */
export const DustRedeemCta = ({ label, onClick }: DustRedeemCtaProps) => {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    },
    [onClick],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className="m-0 inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0"
      data-testid={DUST_REDEEM_CTA_TEST_ID}
    >
      <Icon
        name={IconName.Tag}
        size={IconSize.Sm}
        color={IconColor.SuccessDefault}
        aria-hidden
      />
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.SuccessDefault}
      >
        {label}
      </Text>
    </button>
  );
};
