import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text } from '../../../components/component-library';
import MascotBackgroundAnimation from '../mascot-background-animation/mascot-background-animation';

export default function QuotesLoadingAnimation(props) {
  const { quoteCount, numberOfAggregators } = props;

  const t = useContext(I18nContext);

  return (
    <Box
      marginTop={4}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
    >
      <Box
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
      >
        <Text
          variant={TextVariant.bodyMd}
          as="h6"
          color={TextColor.textAlternative}
          marginLeft={1}
          marginRight={1}
        >
          {t('swapFetchingQuote')}
        </Text>
        <Text
          variant={TextVariant.bodyMdBold}
          as="h6"
          color={TextColor.textAlternative}
        >
          {t('swapQuoteNofM', [
            Math.min(quoteCount + 1, numberOfAggregators),
            numberOfAggregators,
          ])}
        </Text>
      </Box>
      <MascotBackgroundAnimation />
    </Box>
  );
}

QuotesLoadingAnimation.propTypes = {
  quoteCount: PropTypes.number.isRequired,
  numberOfAggregators: PropTypes.number.isRequired,
};
