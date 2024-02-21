import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PulseLoader from '../../../components/ui/pulse-loader';
import { CUSTODY_ACCOUNT_ROUTE } from '../../../helpers/constants/routes';
import { BUILT_IN_NETWORKS } from '../../../../shared/constants/network';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { setProviderType } from '../../../store/actions';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { Box } from '../../../components/component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getInstitutionalConnectRequests } from '../../../ducks/institutional/institutional';

const ConfirmAddCustodianToken = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiActions = mmiActionsFactory();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const connectRequests = useSelector(
    getInstitutionalConnectRequests,
    shallowEqual,
  );
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line no-undef
  const storageItem = localStorage.getItem('tempConnectRequest');

  const tempConnectRequest = JSON.parse(storageItem);

  const connectRequest = connectRequests[0]
    ? connectRequests[0]
    : tempConnectRequest;

  useEffect(() => {
    if (!connectRequest) {
      history.push(mostRecentOverviewPage);
      setIsLoading(false);

      return null;
    }

    setIsLoading(true);

    if (connectRequest.chainId) {
      const networkType = Object.keys(BUILT_IN_NETWORKS).find(
        (key) =>
          Number(BUILT_IN_NETWORKS[key].chainId).toString(10) ===
          connectRequest.chainId.toString(),
      );

      (async () => {
        await dispatch(setProviderType(networkType));
      })();
    }

    let custodianName = connectRequest.service.toLowerCase();

    if (connectRequest.service === 'JSONRPC') {
      custodianName = connectRequest.environment;
    }

    (async () => {
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
    })();

    return history.push(CUSTODY_ACCOUNT_ROUTE);
  }, [
    connectRequest,
    dispatch,
    history,
    trackEvent,
    mmiActions,
    mostRecentOverviewPage,
  ]);

  trackEvent({
    category: MetaMetricsEventCategory.MMI,
    event: MetaMetricsEventName.TokenAdded,
    properties: {
      actions: 'Custodian RPC request',
      custodian: connectRequest.custodian,
      envName: connectRequest.environment,
    },
  });

  return (
    <Box className="page-container">{isLoading ? <PulseLoader /> : null}</Box>
  );
};

export default ConfirmAddCustodianToken;
