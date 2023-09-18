import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  ButtonLink,
  IconName,
  Box,
  ButtonLinkSize,
} from '../../component-library';
import { AlignItems, Display } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { detectNewTokens, showImportTokensModal } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  getIsTokenDetectionSupported,
  getIsTokenDetectionInactiveOnMainnet,
} from '../../../selectors';
import type { BoxProps } from '../../component-library/box';
import type { ImportTokenLinkProps } from './import-token-link.types';

export const ImportTokenLink: React.FC<ImportTokenLinkProps> = ({
  className = '',
  ...props
}): JSX.Element => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const isTokenDetectionSupported = useSelector(getIsTokenDetectionSupported);
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );

  const isTokenDetectionAvailable =
    isTokenDetectionSupported ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);
  return (
    <Box
      className={classnames('multichain-import-token-link', className)}
      {...(props as BoxProps<'div'>)}
    >
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        <ButtonLink
          size={ButtonLinkSize.Md}
          data-testid="import-token-button"
          startIconName={IconName.Add}
          onClick={() => {
            dispatch(showImportTokensModal());
            trackEvent(
              {
                event: MetaMetricsEventName.TokenImportButtonClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  location: 'Home',
                },
              },
              {},
            );
          }}
        >
          {isTokenDetectionAvailable
            ? t('importTokensCamelCase')
            : t('importTokensCamelCase').charAt(0).toUpperCase() +
              t('importTokensCamelCase').slice(1)}
        </ButtonLink>
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} paddingTop={2}>
        <ButtonLink
          size={ButtonLinkSize.Md}
          startIconName={IconName.Refresh}
          data-testid="refresh-list-button"
          onClick={() => dispatch(detectNewTokens())}
        >
          {t('refreshList')}
        </ButtonLink>
      </Box>
    </Box>
  );
};
