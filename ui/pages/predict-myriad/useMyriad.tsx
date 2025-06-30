import { useSelector } from 'react-redux';
import polkamarketsjs from 'polkamarkets-js';
import { getSelectedNetwork } from '../../selectors';
import { Web3Provider } from '@ethersproject/providers';
import { getNetworkClientById } from '../../store/actions';
import { useEffect, useState } from 'react';

export const useMyriad = () => {
  const selectedNetwork = useSelector(getSelectedNetwork);
  const [polymarketsClient, setPolymarketsClient] = useState<any>(null);

  useEffect(() => {
    const initClient = async () => {
      if (!selectedNetwork.clientId) {
        return;
      }
      const networkClient = await getNetworkClientById(
        selectedNetwork.clientId,
      );
      const web3Provider = new Web3Provider(networkClient.provider);
      const client = new polkamarketsjs.Application({
        web3Provider,
      });
      setPolymarketsClient(client);
    };

    initClient();
  }, [selectedNetwork.clientId]);

  return {
    polymarketsClient,
  };
};
