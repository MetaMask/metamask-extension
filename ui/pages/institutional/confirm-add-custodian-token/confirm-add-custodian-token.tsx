import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
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
import {
  BUILT_IN_NETWORKS,
  NetworkType,
} from '../../../../shared/constants/network';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { setActiveNetwork } from '../../../store/actions';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { getMMIConfiguration } from '../../../selectors/institutional/selectors';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Box,
  Text,
} from '../../../components/component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';
import { findCustodianByEnvName } from '../../../helpers/utils/institutional/find-by-custodian-name';

type Label = {
  key: string;
  value: string;
};

type Custodian = {
  type: string;
  iconUrl: string;
  name: string;
  website: string;
  envName: string;
  apiUrl: string | null;
  displayName: string | null;
  production: boolean;
  refreshTokenUrl: string | null;
  websocketApiUrl: string;
  isNoteToTraderSupported: boolean;
  version: number;
  isQRCodeSupported: boolean;
};

const ConfirmAddCustodianToken: React.FC = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiActions = mmiActionsFactory();

  const mmiConfiguration = useSelector(getMMIConfiguration);
  const custodians = mmiConfiguration?.custodians;
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const connectRequests = useSelector(
    getInstitutionalConnectRequests,
    shallowEqual,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [connectError, setConnectError] = useState('');

  const connectRequest = connectRequests?.[0];

  useEffect(() => {
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      setIsLoading(false);
    }
  }, [connectRequest, history, mostRecentOverviewPage]);

  const handleButtonClick = useCallback(
    async (isConfirm: boolean) => {
      try {
        if (isConfirm) {
          setConnectError('');
          setIsLoading(true);

          if (connectRequest?.chainId) {
            const networkType = Object.keys(BUILT_IN_NETWORKS).find(
              (key) =>
                Number(
                  BUILT_IN_NETWORKS[key as keyof typeof BUILT_IN_NETWORKS]
                    .chainId,
                ).toString(10) === connectRequest.chainId.toString(),
            ) as NetworkType | undefined;

            if (networkType) {
              await dispatch(setActiveNetwork(networkType));
            }
          }
        }

        if (connectRequest) {
          await dispatch(
            mmiActions.removeAddTokenConnectRequest({
              origin: connectRequest.origin,
              environment: connectRequest.environment,
              token: connectRequest.token,
            }),
          );

          trackEvent({
            category: MetaMetricsEventCategory.MMI,
            event: MetaMetricsEventName.TokenAdded,
            properties: {
              actions: isConfirm
                ? 'Custodian RPC confirm'
                : 'Custodian RPC cancel',
              custodian: connectRequest.custodian,
              envName: connectRequest.environment,
            },
          });

          if (isConfirm) {
            history.push(CUSTODY_ACCOUNT_ROUTE);
          }
        }
      } catch (e) {
        const errorMessage = (e as Error).message || 'Connection error';
        setConnectError(errorMessage);
        setIsLoading(false);
      }
    },
    [connectRequest, dispatch, history, trackEvent, mmiActions],
  );

  if (!connectRequest) {
    return null;
  }

  useEffect(() => {
    trackEvent({
      category: MetaMetricsEventCategory.MMI,
      event: MetaMetricsEventName.TokenAdded,
      properties: {
        actions: 'Custodian RPC request',
        custodian: connectRequest.custodian,
        envName: connectRequest.environment,
      },
    });
  }, [connectRequest, trackEvent]);

  const custodianLabel =
    connectRequest.labels?.find((label: Label) => label.key === 'service')
      ?.value || t('custodian');

  const custodian = findCustodianByEnvName(
    connectRequest.environment || custodianLabel,
    custodians as Custodian[],
  );

  return (
    <Box className="page-container">
      <Box paddingTop={6} paddingLeft={4} paddingRight={4}>
        <Chip
          borderColor={BorderColor.borderMuted}
          label={connectRequest.origin}
          maxContent={false}
          leftIconUrl={custodian?.iconUrl}
          labelProps={{
            textAlign: TextAlign.Center,
          }}
        />
      </Box>
      <Box padding={4} className="page-container__content">
        <Text
          padding={4}
          fontWeight={FontWeight.Bold}
          variant={TextVariant.headingSm}
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
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              data-testid="cancel-btn"
              onClick={() => handleButtonClick(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              block
              data-testid="confirm-btn"
              size={ButtonSize.Lg}
              onClick={() => handleButtonClick(true)}
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
