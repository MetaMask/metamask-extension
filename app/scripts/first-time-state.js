/**
 * @typedef {object} FirstTimeState
 * @property {object} config Initial configuration parameters
 * @property {object} NetworkController Network controller state
 */

/**
 * @type {FirstTimeState}
 */
const initialState = {
  config: {},
  AddressBookController: {
      addressBook: {
          "0x1": {
              "0x027d4AE98B79D0C52918bAB4c3170bEa701FB8AB": {
                  address: "0x027d4AE98B79D0C52918bAB4c3170bEa701FB8AB",
                  chainId: "0x1",
                  isEns: false,
                  memo: "",
                  name: "Yves",
                  tags: ['allowList']
              },
              "0x2f318C334780961FB129D2a6c30D0763d9a5C970": {
                  address: "0x2f318C334780961FB129D2a6c30D0763d9a5C970",
                  chainId: "0x1",
                  isEns: false,
                  memo: "",
                  name: "Bob",
                  tags: ['blockList']
              },
              "0x7A46ce51fbBB29C34aea1fE9833c27b5D2781925": {
                  address: "0x7A46ce51fbBB29C34aea1fE9833c27b5D2781925",
                  chainId: "0x1",
                  isEns: false,
                  memo: "",
                  name: "Carol",
                  tags: ['blockList']
              },
              "0x9C1ba572b1a3012Fa279B627eD465198C9Bd5f95": {
                  address: "0x9C1ba572b1a3012Fa279B627eD465198C9Bd5f95",
                  chainId: "0x1",
                  isEns: false,
                  memo: "",
                  name: "Carlos",
                  tags: ['allowList']
              },
              "0xE18035BF8712672935FDB4e5e431b1a0183d2DFC": {
                  address: "0xE18035BF8712672935FDB4e5e431b1a0183d2DFC",
                  chainId: "0x1",
                  isEns: false,
                  memo: "",
                  name: "Alice",
                  tags: ['allowList']
              }
          },
          "0x5": {
              "0x027d4AE98B79D0C52918bAB4c3170bEa701FB8AB": {
                  address: "0x027d4AE98B79D0C52918bAB4c3170bEa701FB8AB",
                  chainId: "0x5",
                  isEns: false,
                  memo: "",
                  name: "Yves",
                  tags: ['allowList']
              },
              "0x2f318C334780961FB129D2a6c30D0763d9a5C970": {
                  address: "0x2f318C334780961FB129D2a6c30D0763d9a5C970",
                  chainId: "0x5",
                  isEns: false,
                  memo: "",
                  name: "Bob",
                  tags: ['blockList']
              },
              "0x7A46ce51fbBB29C34aea1fE9833c27b5D2781925": {
                  address: "0x7A46ce51fbBB29C34aea1fE9833c27b5D2781925",
                  chainId: "0x5",
                  isEns: false,
                  memo: "",
                  name: "Carol",
                  tags: ['blockList']
              },
              "0x9C1ba572b1a3012Fa279B627eD465198C9Bd5f95": {
                  address: "0x9C1ba572b1a3012Fa279B627eD465198C9Bd5f95",
                  chainId: "0x5",
                  isEns: false,
                  memo: "",
                  name: "Carlos",
                  tags: ['allowList']
              },
              "0xE18035BF8712672935FDB4e5e431b1a0183d2DFC": {
                  address: "0xE18035BF8712672935FDB4e5e431b1a0183d2DFC",
                  chainId: "0x5",
                  isEns: false,
                  memo: "",
                  name: "Alice",
                  tags: ['allowList']
              }
          }
      }
  },
};
export default initialState;
