import React, { useMemo } from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { NameType } from '@metamask/name-controller';

const CryptoAccountDisplay = ({
  payerAddress,
  tokenSymbol,
  chainId,
}: {
  payerAddress: string;
  tokenSymbol: string;
  chainId: string;
}) => {
  const t = useI18nContext();
  const { name, subtitle } = useDisplayName({
    value: payerAddress,
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: false,
    variation: chainId,
  });

  const accountName = useMemo(() => {
    if (subtitle) {
      return `${name}, ${subtitle}`;
    }
    return name;
  }, [name, subtitle, payerAddress]);

  return (
    <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
      {t('shieldTxDetails3DescriptionCryptoWithAccount', [
        tokenSymbol,
        accountName,
      ])}
    </Text>
  );
};

export default CryptoAccountDisplay;
