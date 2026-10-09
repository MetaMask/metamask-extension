import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { MFA_FLOW_ROUTE } from '../../helpers/constants/routes';
import { useActiveMfaFlow } from '../../hooks/identity/mfa/engine/useActiveMfaFlow';
import type { MfaFlow } from '../../hooks/identity/mfa/engine/types';

/**
 * Opens the MFA page when the running flow has a screen to show. Flows that
 * settle without one (session already valid) never open it.
 *
 * A flow cannot run in the popup: it closes as soon as the user switches to
 * the tab where the code arrived. There, the flow is cancelled and the current
 * page reopens in the expanded view, where the user starts it again.
 */
const MfaFlowLauncher = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const active = useActiveMfaFlow();
  const flow = active?.flow;
  const hasScreen = active !== undefined && active.state.step.name !== 'idle';
  const openedFor = useRef<MfaFlow>();

  useEffect(() => {
    if (!flow || !hasScreen || openedFor.current === flow) {
      return;
    }
    openedFor.current = flow;
    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
      flow.dispatch({ type: 'cancel' });
      globalThis.platform.openExtensionInBrowser(
        pathname,
        search ? search.slice(1) : null,
      );
      return;
    }
    navigate(MFA_FLOW_ROUTE);
  }, [flow, hasScreen, navigate, pathname, search]);

  return null;
};

export default MfaFlowLauncher;
