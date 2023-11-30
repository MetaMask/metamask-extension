import React, { memo } from 'react';
import { Text } from '../../../component-library';
import {
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../../helpers/constants/design-system';
import useTitle from './useTitle';
import useDescription from './useDescription';

export const ConfirmTitle: React.FC = memo(() => {
  const title = useTitle();
  const description = useDescription();

  return (
    <>
      <Text
        variant={TextVariant.headingLg}
        paddingTop={4}
        paddingBottom={2}
        textAlign={TextAlign.Center}
      >
        {title}
      </Text>
      <Text
        paddingBottom={4}
        color={TextColor.textAlternative}
        textAlign={TextAlign.Center}
      >
        {description}
      </Text>
    </>
  );
});
