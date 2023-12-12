// import React, { useEffect, useState } from 'react';
// import 'chartjs-adapter-moment';
// import { Token } from '@metamask/assets-controllers';
// import { useSelector } from 'react-redux';
// import { Text } from '../../component-library';
// import { getTokenList } from '../../../selectors';
// import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
// import { TextVariant } from '../../../helpers/constants/design-system';
// import TokenChart from './token-chart';

// const TokenOverviewV2 = ({ token }: { token: Token }) => {
//   const tokenList = useSelector(getTokenList);
//   // todo chain id?
//   const tokenData = Object.values(tokenList).find(
//     (t) =>
//       t.symbol === token.symbol &&
//       isEqualCaseInsensitive(t.address, token.address),
//   );
//   const name = tokenData?.name || token.symbol;

//   const [spotPrices, setSpotPrices] = useState<any>(); // todo better type

//   // todo use their prefered fiat currency
//   // todo chain id
//   // todo canonicalize address?

//   useEffect(() => {
//     fetch(
//       `https://price-api.metafi.codefi.network/v1/chains/1/spot-prices/${token.address}?vsCurrency=usd`,
//     )
//       .then((data) => data.json())
//       .then((data) => setSpotPrices(data));
//   }, []);

//   return (
//     <>
//       <Text>
//         {name} ({token.symbol})
//       </Text>
//       <Text variant={TextVariant.headingLg}>{spotPrices?.price}</Text>
//       <TokenChart token={token} />
//     </>
//   );
// };

// export default TokenOverviewV2;
