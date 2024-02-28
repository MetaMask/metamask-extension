export interface TokenBalanceProps extends CurrencyDisplayProps {
  token: {
    address: string;
    decimals?: number;
    symbol?: string;
  };
  className?: string;
  showFiat?: boolean;
}

declare const TokenBalance: React.FC<TokenBalanceProps>;
export default TokenBalance;
