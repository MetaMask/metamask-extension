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
import { BUILT_IN_NETWORKS } from '../../../../shared/constants/network';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { setProviderType } from '../../../store/actions';
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

interface ConnectRequest {
  origin: string;
  environment: string;
  token: string;
  chainId?: string;
  custodian: string;
  labels?: Array<{ key: string; value: string }>;
}

interface Custodian {
  iconUrl?: string;
}

interface Custodian {
  iconUrl?: string;
}

interface Custodian {
  iconUrl?: string;
}

const ConfirmAddCustodianToken: React.FC = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiActions = mmiActionsFactory();

  const { custodians } = useSelector(getMMIConfiguration);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const connectRequests = useSelector(
    getInstitutionalConnectRequests,
    shallowEqual,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string>('');

  const connectRequest: ConnectRequest | undefined = connectRequests ? connectRequests[0] : undefined;

  useEffect(() => {
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      setIsLoading(false);
    }
  }, [connectRequest, history, mostRecentOverviewPage]);

  const handleButtonClick = useCallback(
    async ({ isConfirm }: { isConfirm: boolean }) => {
      try {
        if (isConfirm) {
          setConnectError('');
          setIsLoading(true);

          if (connectRequest?.chainId) {
            const networkType = Object.keys(BUILT_IN_NETWORKS).find(
              (key) =>
                Number(BUILT_IN_NETWORKS[key].chainId).toString(10) ===
                connectRequest.chainId?.toString(),
            );

            if (networkType) {
              await dispatch(setProviderType(networkType));
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
        const errorMessage = e instanceof Error ? e.message : 'Connection error';
        setConnectError(errorMessage);
        setIsLoading(false);
      }
    },
    [connectRequest, dispatch, history, trackEvent, mmiActions],
  );

  if (!connectRequest) {
    return null;
  }

  trackEvent({
    category: MetaMetricsEventCategory.MMI,
    event: MetaMetricsEventName.TokenAdded,
    properties: {
      actions: 'Custodian RPC request',
      custodian: connectRequest.custodian,
      envName: connectRequest.environment,
    },
  });

  const custodianLabel =
    connectRequest.labels?.find((label) => label.key === 'service')?.value ||
    t('custodian');

  // Some custodians don't send the "environment" in the connect request
  const custodian: Custodian | undefined = findCustodianByEnvName(
    connectRequest.environment || custodianLabel,
    custodians,
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
              onClick={() => handleButtonClick({ isConfirm: false })}
            >
              {t('cancel')}
            </Button>
            <Button
              block
              data-testid="confirm-btn"
              size={ButtonSize.Lg}
              onClick={() => handleButtonClick({ isConfirm: true })}
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
