import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { TextVariant } from '../../../helpers/constants/design-system';
import { ButtonLink, ButtonLinkSize, Text } from '../../component-library';

export default class PermissionsConnectFooter extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const { t } = this.context;
    return (
      <Box
        className="flex"
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
      >
        <Text variant={TextVariant.bodyMd}>
          {t('onlyConnectTrust', [
            <ButtonLink
              key="permission-connect-footer-learn-more-link"
              size={ButtonLinkSize.Inherit}
              target="_blank"
              onClick={() => {
                global.platform.openTab({
                  url: ZENDESK_URLS.USER_GUIDE_DAPPS,
                });
              }}
            >
              {t('learnMoreUpperCase')}
            </ButtonLink>,
          ])}
        </Text>
      </Box>
    );
  }
}
