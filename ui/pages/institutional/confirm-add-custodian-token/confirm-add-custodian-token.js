import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { useHistory } from 'react-router-dom';
import PulseLoader from '../../../components/ui/pulse-loader';
import { CUSTODY_ACCOUNT_ROUTE } from '../../../helpers/constants/routes';
import {
  Display,
  TextColor,
  TextAlign,
  FontWeight,
  TextVariant,
  BorderColor,
} from '../../../helpers/constants/design-system';
import Chip from '../../../components/ui/chip';
import { BUILT_IN_NETWORKS } from '../../../../shared/constants/network';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { setProviderType } from '../../../store/actions';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import {
  Button,
  BUTTON_SIZES,
  BUTTON_VARIANT,
  Box,
  Text,
} from '../../../components/component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';

const ConfirmAddCustodianToken = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiActions = mmiActionsFactory();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const connectRequests = useSelector(getInstitutionalConnectRequests, isEqual);
  const [isLoading, setIsLoading] = useState(false);
  const [connectError, setConnectError] = useState('');

  const connectRequest = connectRequests ? connectRequests[0] : undefined;

  useEffect(() => {
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      setIsLoading(false);
    }
  }, [connectRequest, history, mostRecentOverviewPage]);

  if (!connectRequest) {
    return null;
  }

  trackEvent({
    category: MetaMetricsEventCategory.MMI,
    event: MetaMetricsEventName.TokenAdded,
    properties: {
      actions: 'Custodian RPC request',
      custodian: connectRequest.custodian,
      apiUrl: connectRequest.apiUrl,
    },
  });

  let custodianLabel = '';

  if (
    connectRequest.labels &&
    connectRequest.labels.some((label) => label.key === 'service')
  ) {
    custodianLabel = connectRequest.labels.find(
      (label) => label.key === 'service',
    ).value;
  }

  return (
    <Box className="page-container">
      <Box paddingTop={6} paddingLeft={4} paddingRight={4}>
        <Text>
          <Chip
            borderColor={BorderColor.borderMuted}
            label={connectRequest.origin}
            maxContent={false}
            leftIconUrl="https://dashboard.metamask-institutional.io/custodian-icons/qredo-icon.svg"
            labelProps={{
              textAlign: TextAlign.Center,
            }}
          />
        </Text>
      </Box>
      <Box padding={4} className="page-container__content">
        <Text
          padding={4}
          fontWeight={FontWeight.Bold}
          variant={TextVariant.headingSm}
          as="h5"
        >
          {t('confirmConnectionTitle', [custodianLabel])}
        </Text>

        <Text
          paddingTop={3}
          paddingLeft={4}
          paddingRight={4}
          color={TextColor.textAlternative}
        >
          {t('allowMmiToConnectToCustodian', [custodianLabel])}
        </Text>
      </Box>

      <Box marginTop={4} data-testid="connect-custodian-token-error">
        <Text data-testid="error-message" textAlign={TextAlign.Center}>
          {connectError}
        </Text>
      </Box>

      <Box as="footer" className="page-container__footer" padding={4}>
        {isLoading ? (
          <PulseLoader />
        ) : (
          <Box display={Display.Flex} gap={4}>
            <Button
              block
              variant={BUTTON_VARIANT.SECONDARY}
              size={BUTTON_SIZES.LG}
              data-testid="cancel-btn"
              onClick={async () => {
                await dispatch(
                  mmiActions.removeAddTokenConnectRequest({
                    origin: connectRequest.origin,
                    apiUrl: connectRequest.apiUrl,
                    token: connectRequest.token,
                  }),
                );

                trackEvent({
                  category: MetaMetricsEventCategory.MMI,
                  event: MetaMetricsEventName.TokenAdded,
                  properties: {
                    actions: 'Custodian RPC cancel',
                    custodian: connectRequest.custodian,
                    apiUrl: connectRequest.apiUrl,
                  },
                });
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              block
              data-testid="confirm-btn"
              size={BUTTON_SIZES.LG}
              onClick={async () => {
                setConnectError('');
                setIsLoading(true);

                try {
                  if (connectRequest.chainId) {
                    const networkType = Object.keys(BUILT_IN_NETWORKS).find(
                      (key) =>
                        Number(BUILT_IN_NETWORKS[key].chainId).toString(10) ===
                        connectRequest.chainId.toString(),
                    );
                    await dispatch(setProviderType(networkType));
                  }

                  let custodianName = connectRequest.service.toLowerCase();

                  if (connectRequest.service === 'JSONRPC') {
                    custodianName = connectRequest.environment;
                  }

                  await dispatch(
                    mmiActions.setCustodianConnectRequest({
                      token: connectRequest.token,
                      apiUrl: connectRequest.apiUrl,
                      custodianName,
                      custodianType: connectRequest.service,
                    }),
                  );

                  await dispatch(
                    mmiActions.removeAddTokenConnectRequest({
                      origin: connectRequest.origin,
                      apiUrl: connectRequest.apiUrl,
                      token: connectRequest.token,
                    }),
                  );

                  trackEvent({
                    category: MetaMetricsEventCategory.MMI,
                    event: MetaMetricsEventName.TokenAdded,
                    properties: {
                      actions: 'Custodian RPC confirm',
                      custodian: connectRequest.custodian,
                      apiUrl: connectRequest.apiUrl,
                    },
                  });

                  history.push(CUSTODY_ACCOUNT_ROUTE);
                } catch (e) {
                  let errorMessage = e.message;

                  if (!errorMessage) {
                    errorMessage = 'Connection error';
                  }

                  setConnectError(errorMessage);
                  setIsLoading(false);
                }
              }}
            >
              {t('allow')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ConfirmAddCustodianToken;
