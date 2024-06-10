import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import { getProviderConfig, getTokens } from '../../ducks/metamask/metamask';
import { getTokenList } from '../../selectors';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import Identicon from '../../components/ui/identicon';
import { I18nContext } from '../../contexts/i18n';
import { useTokenTracker } from '../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../hooks/useTokenFiatAmount';
import { showModal } from '../../store/actions';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import { ASSET_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';
import Tooltip from '../../components/ui/tooltip';
import Button from '../../components/ui/button';
import Box from '../../components/ui/box';
import {
  TextVariant,
  FontWeight,
  DISPLAY,
  TextAlign,
  OverflowWrap,
  TextColor,
  IconColor,
} from '../../helpers/constants/design-system';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../components/component-library';

export default function TokenDetailsPage() {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useContext(I18nContext);
  const tokens = useSelector(getTokens);
  const tokenList = useSelector(getTokenList);
  const { address: tokenAddress } = useParams();
  const tokenMetadata = tokenList[tokenAddress.toLowerCase()];
  const aggregators = tokenMetadata?.aggregators?.join(', ');

  const token = tokens.find(({ address }) =>
    isEqualCaseInsensitive(address, tokenAddress),
  );

  // When the user did not import the token
  // the token variable will be undefined.
  // In that case we want to call useTokenTracker with [] instead of [undefined]
  const { tokensWithBalances } = useTokenTracker({
    tokens: token ? [token] : [],
  });
  const tokenBalance = tokensWithBalances[0]?.string;

  const tokenCurrencyBalance = useTokenFiatAmount(
    token?.address,
    tokenBalance,
    token?.symbol,
  );

  const { nickname, type: networkType } = useSelector(getProviderConfig);

  const [copied, handleCopy] = useCopyToClipboard();

  if (!token) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return (
    <Box className="page-container token-details">
      <Box marginLeft={5} marginRight={6}>
        <Text
          fontWeight={FontWeight.Bold}
          margin={0}
          marginTop={4}
          variant={TextVariant.bodySm}
          as="h6"
          color={TextColor.textDefault}
          className="token-details__title"
        >
          {t('tokenDetails')}
          <Button
            type="link"
            onClick={() => history.push(`${ASSET_ROUTE}/${token.address}`)}
            className="token-details__closeButton"
          />
        </Text>
        <Box display={DISPLAY.FLEX} marginTop={4}>
          <Text
            align={TextAlign.Center}
            fontWeight={FontWeight.Bold}
            margin={0}
            marginRight={5}
            variant={TextVariant.headingSm}
            as="h4"
            color={TextColor.textDefault}
            className="token-details__token-value"
          >
            {tokenBalance || ''}
          </Text>
          <Box marginTop={1}>
            <Identicon
              diameter={32}
              address={token.address}
              image={tokenMetadata ? tokenMetadata.iconUrl : token.image}
            />
          </Box>
        </Box>
        <Text
          margin={0}
          marginTop={4}
          variant={TextVariant.bodySm}
          as="h6"
          color={TextColor.textAlternative}
        >
          {tokenCurrencyBalance || ''}
        </Text>
        <Text
          margin={0}
          marginTop={6}
          variant={TextVariant.bodyXs}
          as="h6"
          color={TextColor.textAlternative}
          fontWeight={FontWeight.Bold}
        >
          {t('tokenContractAddress')}
        </Text>
        <Box display={DISPLAY.FLEX}>
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            margin={0}
            marginTop={2}
            color={TextColor.textDefault}
            overflowWrap={OverflowWrap.BreakWord}
            className="token-details__token-address"
          >
            {token.address}
          </Text>
          <Tooltip
            position="bottom"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            containerClassName="token-details__copy-icon"
          >
            <ButtonIcon
              ariaLabel="copy"
              name={copied ? IconName.CopySuccess : IconName.Copy}
              className="token-details__copyIcon"
              onClick={() => handleCopy(token.address)}
              color={IconColor.primaryDefault}
              size={ButtonIconSize.Sm}
            />
          </Tooltip>
        </Box>
        <Text
          variant={TextVariant.bodyXs}
          as="h6"
          margin={0}
          marginTop={4}
          color={TextColor.textAlternative}
          fontWeight={FontWeight.Bold}
        >
          {t('tokenDecimalTitle')}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          margin={0}
          marginTop={1}
          color={TextColor.textDefault}
        >
          {token.decimals}
        </Text>
        <Text
          variant={TextVariant.bodyXs}
          as="h6"
          margin={0}
          marginTop={4}
          color={TextColor.textAlternative}
          fontWeight={FontWeight.Bold}
        >
          {t('network')}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          margin={1}
          marginTop={0}
          color={TextColor.textDefault}
        >
          {networkType === NETWORK_TYPES.RPC
            ? nickname ?? t('privateNetwork')
            : t(networkType)}
        </Text>
        {aggregators && (
          <>
            <Text
              variant={TextVariant.bodyXs}
              as="h6"
              margin={0}
              marginTop={4}
              color={TextColor.textAlternative}
              fontWeight={FontWeight.Bold}
            >
              {t('tokenList')}:
            </Text>
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              margin={0}
              marginTop={1}
              color={TextColor.textDefault}
            >
              {`${aggregators}.`}
            </Text>
          </>
        )}
        <Button
          type="secondary"
          className="token-details__hide-token-button"
          onClick={() => {
            dispatch(
              showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token, history }),
            );
          }}
        >
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            color={TextColor.primaryDefault}
          >
            {t('hideToken')}
          </Text>
        </Button>
      </Box>
    </Box>
  );
}
