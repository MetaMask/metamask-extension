import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, ButtonLink, ButtonLinkSize, Text } from '../../component-library';

export default class PermissionsConnectFooter extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const { t } = this.context;
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
      >
        <Text variant={TextVariant.bodyMd}>
          {t('onlyConnectTrust')}
          <ButtonLink
            size={ButtonLinkSize.Inherit}
            target="_blank"
            onClick={() => {
              global.platform.openTab({
                url: ZENDESK_URLS.USER_GUIDE_DAPPS,
              });
            }}
          >
            &nbsp;{t('learnMoreUpperCase')}&nbsp;
          </ButtonLink>
        </Text>
      </Box>
    );
  }
}
