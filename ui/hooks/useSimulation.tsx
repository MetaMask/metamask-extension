/* eslint-disable import/unambiguous */
import * as dotenv from 'dotenv';

dotenv.config(); // load environment variables using dotenv
const axios = require('axios').default;

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = process.env;
const SIMULATE_URL = `https://api.tenderly.co/api/v1/account/owencraston/project/ETHNYC2/simulate`;

export const useSimulation = async (transaction: any) => {
  // set up your access-key, if you don't have one or you want to generate new one follow next link
  // https://dashboard.tenderly.co/account/authorization
  const opts = {
    headers: {
      'X-Access-Key': TENDERLY_ACCESS_KEY as string,
    },
  };

  const body = {
    // standard TX fields
    network_id: transaction.chainId,
    from: transaction.txParams.from,
    to: transaction.txParams.to,
    input: transaction.txParams.data,
    gas: 21204,
    gas_price: '0',
    value: 0,
    // simulation config (tenderly specific)
    save_if_fails: true,
    save: false,
    simulation_type: 'quick',
  };

  console.log('body', body);

  const resp = await axios.post(SIMULATE_URL, body, opts);

  console.log('useSimulation', resp);

  return resp;
};
