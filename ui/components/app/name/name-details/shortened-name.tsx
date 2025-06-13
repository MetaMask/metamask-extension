import React, { memo } from 'react';
import { Text } from '../../../component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { shortenString } from '../../../../helpers/utils/util';

export type ShortenedNameProps = {
  name: string;
};

const MAX_PET_NAME_LENGTH = 12;

const ShortenedName = memo(({ name }: ShortenedNameProps) => {
  const shortenedName = shortenString(name || '', {
    truncatedCharLimit: MAX_PET_NAME_LENGTH,
    truncatedStartChars: MAX_PET_NAME_LENGTH - 3,
    truncatedEndChars: 0,
    skipCharacterInEnd: true,
  });
  return (
    <Text className="name__name" variant={TextVariant.bodyMd}>
      {shortenedName}
    </Text>
  );
});

export default ShortenedName;
