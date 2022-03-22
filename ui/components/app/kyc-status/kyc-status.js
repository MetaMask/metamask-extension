import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { showModal } from '../../../store/actions';
import Identicon from '../../ui/identicon';
import ListItem from '../../ui/list-item';
import Tooltip from '../../ui/tooltip';
import InfoIcon from '../../ui/icon/info-icon.component';
import Button from '../../ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMetricEvent } from '../../../hooks/useMetricEvent';
import { ASSET_TYPES, updateSendAsset } from '../../../ducks/send';
import { KYC_FLOW } from '../../../helpers/constants/routes';
import { SEVERITIES } from '../../../helpers/constants/design-system';
import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import CheckKycStatus from './check-kyc-status';

const KycStatus = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  return (
    <div className="kyc-verify">
      <CheckKycStatus history={history} />
    </div>
  );
};

KycStatus.propTypes = {};

KycStatus.defaultProps = {};

export default KycStatus;
