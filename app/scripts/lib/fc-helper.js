import contractMap from '@yqrashawn/cfx-contract-metadata'

export const FC_TOKEN_ADDRESS = Object.keys(contractMap).find((address) => {
  return contractMap[address].symbol === 'FC'
})

export const FC = contractMap[FC_TOKEN_ADDRESS]

export const FC_TOKEN_MAP = {
  address: FC_TOKEN_ADDRESS,
  decimals: FC.decimals,
  symbol: FC.symbol,
}
