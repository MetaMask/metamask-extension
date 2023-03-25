import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import { getTokens } from '../../ducks/metamask/metamask';
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
import Typography from '../../components/ui/typography';
import {
  TypographyVariant,
  FONT_WEIGHT,
  DISPLAY,
  TEXT_ALIGN,
  OVERFLOW_WRAP,
  TextColor,
  IconColor,
} from '../../helpers/constants/design-system';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  ButtonIcon,
  IconSize,
  IconName,
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

  const { tokensWithBalances } = useTokenTracker([token]);
  const tokenBalance = tokensWithBalances[0]?.string;
  const tokenCurrencyBalance = useTokenFiatAmount(
    token?.address,
    tokenBalance,
    token?.symbol,
  );

  const currentNetwork = useSelector((state) => ({
    nickname: state.metamask.provider.nickname,
    type: state.metamask.provider.type,
  }));

  const { nickname, type: networkType } = currentNetwork;

  const [copied, handleCopy] = useCopyToClipboard();

  if (!token) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return (
    <Box className="page-container token-details">
      <Box marginLeft={5} marginRight={6}>
        <Typography
          fontWeight={FONT_WEIGHT.BOLD}
          margin={0}
          marginTop={4}
          variant={TypographyVariant.H6}
          color={TextColor.textDefault}
          className="token-details__title"
        >
          {t('tokenDetails')}
          <Button
            type="link"
            onClick={() => history.push(`${ASSET_ROUTE}/${token.address}`)}
            className="token-details__closeButton"
          />
        </Typography>
        <Box display={DISPLAY.FLEX} marginTop={4}>
          <Typography
            align={TEXT_ALIGN.CENTER}
            fontWeight={FONT_WEIGHT.BOLD}
            margin={0}
            marginRight={5}
            variant={TypographyVariant.H4}
            color={TextColor.textDefault}
            className="token-details__token-value"
          >
            {tokenBalance || ''}
          </Typography>
          <Box marginTop={1}>
            <Identicon
              diameter={32}
              address={token.address}
              image={tokenMetadata ? tokenMetadata.iconUrl : token.image}
            />
          </Box>
        </Box>
        <Typography
          margin={0}
          marginTop={4}
          variant={TypographyVariant.H7}
          color={TextColor.textAlternative}
        >
          {tokenCurrencyBalance || ''}
        </Typography>
        <Typography
          margin={0}
          marginTop={6}
          variant={TypographyVariant.H9}
          color={TextColor.textAlternative}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('tokenContractAddress')}
        </Typography>
        <Box display={DISPLAY.FLEX}>
          <Typography
            variant={TypographyVariant.H7}
            margin={0}
            marginTop={2}
            color={TextColor.textDefault}
            overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
            className="token-details__token-address"
          >
            {token.address}
          </Typography>
          <Tooltip
            position="bottom"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            containerClassName="token-details__copy-icon"
          >
            <ButtonIcon
              ariaLabel="copy"
              name={copied ? IconName.CopySuccuss : IconName.Copy}
              className="token-details__copyIcon"
              onClick={() => handleCopy(token.address)}
              color={IconColor.primaryDefault}
              size={IconSize.Sm}
            />
          </Tooltip>
        </Box>
        <Typography
          variant={TypographyVariant.H9}
          margin={0}
          marginTop={4}
          color={TextColor.textAlternative}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('tokenDecimalTitle')}
        </Typography>
        <Typography
          variant={TypographyVariant.H7}
          margin={0}
          marginTop={1}
          color={TextColor.textDefault}
        >
          {token.decimals}
        </Typography>
        <Typography
          variant={TypographyVariant.H9}
          margin={0}
          marginTop={4}
          color={TextColor.textAlternative}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('network')}
        </Typography>
        <Typography
          variant={TypographyVariant.H7}
          margin={1}
          marginTop={0}
          color={TextColor.textDefault}
        >
          {networkType === NETWORK_TYPES.RPC
            ? nickname ?? t('privateNetwork')
            : t(networkType)}
        </Typography>
        {aggregators && (
          <>
            <Typography
              variant={TypographyVariant.H9}
              margin={0}
              marginTop={4}
              color={TextColor.textAlternative}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('tokenList')}
            </Typography>
            <Typography
              variant={TypographyVariant.H7}
              margin={0}
              marginTop={1}
              color={TextColor.textDefault}
            >
              {`${aggregators}.`}
            </Typography>
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
          <Typography
            variant={TypographyVariant.H6}
            color={TextColor.primaryDefault}
          >
            {t('hideToken')}
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}
