import React from 'react';
import { useHistory, useParams, Redirect } from 'react-router-dom';
import { Hex } from '@metamask/utils';
import {
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  SensitiveText,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TokenCell from '../../../components/app/assets/token-cell';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { defiData } from './data';

import { TokenWithFiatAmount } from '../../../components/app/assets/types';

type Token = TokenWithFiatAmount & {
  type: 'underlying' | 'underlying-claimable';
};

function extractUnderlyingTokens(positions: any, chainId: Hex): Token[][] {
  return positions?.map((group: any) =>
    group.flatMap((position: any) =>
      position.tokens.map(
        ({
          marketValue,
          name,
          iconUrl,
          type,
          balanceRaw,
          decimals,
          address,
        }: any) => ({
          address: address,
          title: name,
          symbol: name,
          tokenFiatAmount: marketValue,
          image: iconUrl,
          primary: balanceRaw.toString(),
          secondary: balanceRaw,
          decimals,
          chainId: chainId,
          type,
        }),
      ),
    ),
  );
}
const DetailsList = ({
  tokens,
  positionType,
}: {
  tokens: Token[][];
  positionType: 'Supplied' | 'Staked' | 'Borrowed';
}) => {
  return (
    <>
      {tokens.map((tokenGroup: Token[]) => {
        console.log('tokenGroup', tokenGroup);

        const underlying = tokenGroup
          .filter((token: Token) => token.type === 'underlying')
          .filter(Boolean);

        const underlyingRewards = tokenGroup
          .filter((token: Token) => token.type === 'underlying-claimable')
          .filter(Boolean);

        return (
          <>
            {underlying.length > 0 && (
              <>
                <Text
                  variant={TextVariant.bodySm}
                  paddingLeft={4}
                  color={TextColor.textAlternativeSoft}
                  paddingBottom={4}
                >
                  {positionType}
                </Text>
                {underlying.map((token) => (
                  <TokenCell
                    key={`${token.chainId}-${token.address}`}
                    token={token}
                    privacyMode={false}
                  />
                ))}
              </>
            )}
            {underlyingRewards.length > 0 && (
              <>
                <Text
                  variant={TextVariant.bodySm}
                  paddingLeft={4}
                  paddingBottom={4}
                >
                  {'Rewards'}
                </Text>
                {underlyingRewards.map((token) => (
                  <TokenCell
                    key={`${token.chainId}-${token.address}`}
                    token={token}
                    privacyMode={false}
                  />
                ))}
              </>
            )}
          </>
        );
      })}
    </>
  );
};

export const DeFiDetails = ({
  chainId,
  protocolId,
}: {
  chainId: Hex;
  protocolId: string;
}) => {
  const chainData = defiData[chainId as keyof typeof defiData];
  const protocol = chainData.protocols[
    protocolId as keyof typeof chainData.protocols
  ] as any;

  if (!protocol) return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;

  const protocolName = protocol.protocolDetails.name;
  const aggregatedMarketValue = protocol.aggregatedMarketValue;

  const supply = extractUnderlyingTokens(
    protocol.positionTypes.supply?.positions,
    chainId,
  );

  const borrow = extractUnderlyingTokens(
    protocol.positionTypes.borrow?.positions,
    chainId,
  );

  const stake = extractUnderlyingTokens(
    protocol.positionTypes.stake?.positions,
    chainId,
  );

  const t = useI18nContext();
  const history = useHistory();

  return (
    <div className="main-container asset__container">
      <Box>
        <Box paddingLeft={2}>
          <Box display={Display.Flex} paddingBottom={4} paddingTop={4}>
            <ButtonIcon
              color={IconColor.iconAlternative}
              marginRight={1}
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              onClick={() => history.push(DEFAULT_ROUTE)}
            />
          </Box>
        </Box>

        <Text variant={TextVariant.headingLg} paddingLeft={4} paddingBottom={2}>
          {protocolName}
        </Text>
        <Box paddingLeft={4} paddingBottom={4}>
          <SensitiveText
            className="mm-box--color-text-alternative-soft"
            ellipsis
            variant={TextVariant.inherit}
            isHidden={false}
            data-testid="account-value-and-suffix"
          >
            {'$'}
            {aggregatedMarketValue}
          </SensitiveText>
        </Box>
        <Box paddingLeft={4} paddingBottom={4} paddingRight={4}>
          <hr
            style={{
              border: '1px solid var(--border-muted, #858B9A33)',
            }}
          />
        </Box>
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <>
            {supply && supply.length > 0 && (
              <DetailsList tokens={supply} positionType={'Supplied'} />
            )}
          </>
          <>
            {borrow && borrow.length > 0 && (
              <DetailsList tokens={borrow} positionType={'Borrowed'} />
            )}
          </>
          <>
            {stake && stake.length > 0 && (
              <DetailsList tokens={stake} positionType={'Staked'} />
            )}
          </>
        </Box>
      </Box>
    </div>
  );
};

const DeFiPage = () => {
  const { chainId, protocolId } = useParams<{
    chainId: Hex;
    protocolId: string;
  }>();

  if (!chainId || !protocolId) {
    return null;
  }
  return <DeFiDetails chainId={chainId} protocolId={protocolId} />;
};

export default DeFiPage;
