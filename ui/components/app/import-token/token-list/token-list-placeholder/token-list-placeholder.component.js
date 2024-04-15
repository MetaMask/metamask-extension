import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { ButtonLink, Text, Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  AlignItems,
} from '../../../../../helpers/constants/design-system';

export default class TokenListPlaceholder extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
        textAlign={TextAlign.Center}
      >
        <Text color={TextColor.textAlternative}>
          {this.context.t('addAcquiredTokens')}
        </Text>
        <ButtonLink href={ZENDESK_URLS.ADD_CUSTOM_TOKENS} externalLink>
          {this.context.t('learnMoreUpperCase')}
        </ButtonLink>
      </Box>
    );
  }
}
