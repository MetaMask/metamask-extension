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
  // const sendTokenEvent = useMetricEvent({
  //   eventOpts: {
  //     category: 'Navigation',
  //     action: 'Home',
  //     name: 'Clicked Send: Token',
  //   },
  // });
  // const titleIcon = warning ? (
  //   <Tooltip
  //     wrapperClassName="asset-list-item__warning-tooltip"
  //     interactive
  //     position="bottom"
  //     html={warning}
  //   >
  //     <InfoIcon severity={SEVERITIES.WARNING} />
  //   </Tooltip>
  // ) : null;

  // const midContent = warning ? (
  //   <>
  //     <InfoIcon severity={SEVERITIES.WARNING} />
  //     <div className="asset-list-item__warning">{warning}</div>
  //   </>
  // ) : null;

  return (
    <div className="kyc-verify">
      <CheckKycStatus history={history} />
    </div>
  );
};

KycStatus.propTypes = {
  // className: PropTypes.string,
  // 'data-id': PropTypes.string,
  // iconClassName: PropTypes.string,
  // onClick: PropTypes.func.isRequired,
  // tokenAddress: PropTypes.string,
  // tokenSymbol: PropTypes.string,
  // tokenDecimals: PropTypes.number,
  // tokenImage: PropTypes.string,
  // warning: PropTypes.node,
  // primary: PropTypes.string,
  // secondary: PropTypes.string,
  // identiconBorder: PropTypes.bool,
  // isERC721: PropTypes.bool,
};

KycStatus.defaultProps = {
  // className: undefined,
  // 'data-id': undefined,
  // iconClassName: undefined,
  // tokenAddress: undefined,
  // tokenImage: undefined,
  // warning: undefined,
};

export default KycStatus;
