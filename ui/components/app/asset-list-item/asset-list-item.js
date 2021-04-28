import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Identicon from '../../ui/identicon';
import ListItem from '../../ui/list-item';
import Tooltip from '../../ui/tooltip';
import InfoIcon from '../../ui/icon/info-icon.component';
import Button from '../../ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMetricEvent } from '../../../hooks/useMetricEvent';
import { updateSendToken } from '../../../store/actions';
import { SEND_ROUTE } from '../../../helpers/constants/routes';
import { SEVERITIES } from '../../../helpers/constants/design-system';

const AssetListItem = ({
  className,
  'data-testid': dataTestId,
  iconClassName,
  onClick,
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
  tokenImage,
  warning,
  primary,
  secondary,
  identiconBorder,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const sendTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Send: Token',
    },
  });
  const titleIcon = warning ? (
    <Tooltip
      wrapperClassName="asset-list-item__warning-tooltip"
      interactive
      position="bottom"
      html={warning}
    >
      <InfoIcon severity={SEVERITIES.WARNING} />
    </Tooltip>
  ) : null;

  const midContent = warning ? (
    <>
      <InfoIcon severity={SEVERITIES.WARNING} />
      <div className="asset-list-item__warning">{warning}</div>
    </>
  ) : null;

  const sendTokenButton = useMemo(() => {
    if (tokenAddress === null || tokenAddress === undefined) {
      return null;
    }
    return (
      <Button
        type="link"
        className="asset-list-item__send-token-button"
        onClick={(e) => {
          e.stopPropagation();
          sendTokenEvent();
          dispatch(
            updateSendToken({
              address: tokenAddress,
              decimals: tokenDecimals,
              symbol: tokenSymbol,
            }),
          );
          history.push(SEND_ROUTE);
        }}
      >
        {t('sendSpecifiedTokens', [tokenSymbol])}
      </Button>
    );
  }, [
    tokenSymbol,
    sendTokenEvent,
    tokenAddress,
    tokenDecimals,
    history,
    t,
    dispatch,
  ]);

  return (
    <ListItem
      className={classnames('asset-list-item', className)}
      data-testid={dataTestId}
      title={
        <button
          className="asset-list-item__token-button"
          onClick={onClick}
          title={`${primary} ${tokenSymbol}`}
        >
          <h2>
            <span className="asset-list-item__token-value">{primary}</span>
            <span className="asset-list-item__token-symbol">{tokenSymbol}</span>
          </h2>
        </button>
      }
      titleIcon={titleIcon}
      subtitle={<h3 title={secondary}>{secondary}</h3>}
      onClick={onClick}
      icon={
        <Identicon
          className={iconClassName}
          diameter={32}
          address={tokenAddress}
          image={tokenImage}
          alt={`${primary} ${tokenSymbol}`}
          imageBorder={identiconBorder}
        />
      }
      midContent={midContent}
      rightContent={
        <>
          <i className="fas fa-chevron-right asset-list-item__chevron-right" />
          {sendTokenButton}
        </>
      }
    />
  );
};

AssetListItem.propTypes = {
  'className': PropTypes.string,
  'data-testid': PropTypes.string,
  'iconClassName': PropTypes.string,
  'onClick': PropTypes.func.isRequired,
  'tokenAddress': PropTypes.string,
  'tokenSymbol': PropTypes.string,
  'tokenDecimals': PropTypes.number,
  'tokenImage': PropTypes.string,
  'warning': PropTypes.node,
  'primary': PropTypes.string,
  'secondary': PropTypes.string,
  'identiconBorder': PropTypes.bool,
};

AssetListItem.defaultProps = {
  'className': undefined,
  'data-testid': undefined,
  'iconClassName': undefined,
  'tokenAddress': undefined,
  'tokenImage': undefined,
  'warning': undefined,
};

export default AssetListItem;
