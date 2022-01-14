import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Identicon from '../../components/ui/identicon/identicon.component';
import { I18nContext } from '../../contexts/i18n';
import { useTokenTracker } from '../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../hooks/useTokenFiatAmount';
import { showModal } from '../../store/actions';
import { NETWORK_TYPE_RPC } from '../../../shared/constants/network';
import { ASSET_ROUTE } from '../../helpers/constants/routes';
import TokenDetailsScreen from './token-details-screen';

export default function ShowTokenDetails({ token }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useContext(I18nContext);
  const { tokensWithBalances } = useTokenTracker([token]);
  const balanceToRender = tokensWithBalances[0]?.string;
  const formattedFiatBalance = useTokenFiatAmount(
    token.address,
    balanceToRender,
    token.symbol,
  );

  const currentNetwork = useSelector((state) => ({
    nickname: state.metamask.provider.nickname,
    type: state.metamask.provider.type,
  }));

  const { nickname: networkNickname, type: networkType } = currentNetwork;

  return (
    <TokenDetailsScreen
      value={balanceToRender}
      onClose={() => history.push(`${ASSET_ROUTE}/${token.address}`)}
      currentCurrency={formattedFiatBalance || ''}
      network={
        networkType === NETWORK_TYPE_RPC
          ? networkNickname ?? t('privateNetwork')
          : t(networkType)
      }
      icon={
        <Identicon diameter={32} address={token.address} image={token.image} />
      }
      decimals={token.decimals}
      address={token.address}
      onHideToken={() =>
        dispatch(showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))
      }
    />
  );
}

ShowTokenDetails.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
    image: PropTypes.string,
  }).isRequired,
};
