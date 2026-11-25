import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import Box from '../../../components/ui/box';
import { I18nContext } from '../../../contexts/i18n';
import { getURLHostName } from '../../../helpers/utils/util';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  Text,
  TextColor,
} from '../../../components/component-library';
import { TextVariant } from '../../../helpers/constants/design-system';

export default function ViewOnBlockExplorer({
  blockExplorerUrl,
  sensitiveTrackingProperties,
}) {
  const t = useContext(I18nContext);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const blockExplorerHostName = getURLHostName(blockExplorerUrl);

  return (
    <Box marginTop={6} className="view-on-block-explorer">
      <Text
        as="button"
        variant={TextVariant.bodyXs}
        color={TextColor.primaryDefault}
        onClick={() => {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.ExternalLinkClicked)
              .addCategory(MetaMetricsEventCategory.Swaps)
              .addSensitiveProperties(sensitiveTrackingProperties)
              .addProperties({
                link_type: MetaMetricsEventLinkType.TransactionBlockExplorer,
                location: 'Swap Transaction',
                url_domain: blockExplorerHostName,
              })
              .build(),
          );
          global.platform.openTab({ url: blockExplorerUrl });
        }}
      >
        {t('viewOnCustomBlockExplorer', [
          t('blockExplorerSwapAction'),
          blockExplorerHostName,
        ])}
      </Text>
    </Box>
  );
}

ViewOnBlockExplorer.propTypes = {
  blockExplorerUrl: PropTypes.string.isRequired,
  sensitiveTrackingProperties: PropTypes.object.isRequired,
};
