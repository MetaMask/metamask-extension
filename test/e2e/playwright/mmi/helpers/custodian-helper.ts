import axios from 'axios';

const { MMI_E2E_MMI_CONFIG_URL } = process.env;

export async function getCustodianInfoByName(name: string) {
  // First get an admin token
  try {
    const { custodians } = (await axios.get(`${MMI_E2E_MMI_CONFIG_URL}`)).data;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return custodians.filter(function (custodian: any) {
      return custodian.name === name;
    });
  } catch (error) {
    console.error(error);
    return error;
  }
}
