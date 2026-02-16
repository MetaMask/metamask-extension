import React from 'react';
import {
  Text,
  AvatarToken,
  AvatarTokenSize,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';

type Props = {
  label: string;
  iconSrc: string | undefined;
  symbol: string;
  amount: number;
  variant: 'sent' | 'received';
};

export const TokenAmountBlock = ({
  label,
  iconSrc,
  symbol,
  amount,
  variant,
}: Props) => (
  <div className="flex flex-col gap-2">
    <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
      {label}
    </Text>
    <div className="flex items-center gap-3">
      <AvatarToken
        src={iconSrc ?? ''}
        name={symbol}
        size={AvatarTokenSize.Md}
      />
      <Text
        variant={TextVariant.HeadingLg}
        fontWeight={FontWeight.Medium}
        color={variant === 'received' ? TextColor.SuccessDefault : undefined}
      >
        {variant === 'sent' ? '-' : '+'}
        {Math.abs(amount)} {symbol}
      </Text>
    </div>
  </div>
);
