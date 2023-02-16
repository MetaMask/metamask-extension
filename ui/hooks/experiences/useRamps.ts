import { useCallback } from 'react';

interface IUseRamps {
  openBuyCryptoInPdapp: VoidFunction;
}

const useRamps = (): IUseRamps => {
  const openBuyCryptoInPdapp = useCallback(() => {
    const portfolioUrl = process.env.PORTFOLIO_URL;
    global.platform.openTab({
      url: `${portfolioUrl}/buy?metamaskEntry=ext_buy_button`,
    });
  }, []);

  return { openBuyCryptoInPdapp };
};

export default useRamps;
