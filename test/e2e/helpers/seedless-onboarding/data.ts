/* eslint-disable @typescript-eslint/naming-convention */
// disable eslint naming convention to match the server response fields

export const MockJwtPrivateKey = `-----BEGIN PRIVATE KEY-----\nMEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==\n-----END PRIVATE KEY-----`;

export const MockAuthPubKey =
  '04b02bd479380f5deee3963aee4af81d422b934975f1b7ec59f56c3afc97c440773b0a79edd1987f26d9a8b2f7479c095b1e6941c7bf11af70a910e0ad4295010f';

// Mock data for TOPRF Key shares
export const MockKeyShareData = {
  verifier: 'torus-test-health-aggregate',
  verifier_id: 'e2e-user-mock@gmail.com',
  pub_key: MockAuthPubKey,
  share_import_items: [
    {
      encrypted_share:
        '{"data":"308c8f68069050375e440565291d083a6aeeb09eb09d44a6e06fe64752281bc096f5af27b035187f01c16774e039c6ce","metadata":{"iv":"fb685e32b136f5603908af0e31ba8f2b","ephemPublicKey":"047ea91a8294a868eb1183f44042401f728495cbe83c7e4a2a5ef47dafdeba919b6e2af74ed028ef79eb9e94f7343858f99621adfde49c383a0e663ae8ba048f02","mac":"58310ef843981af87e5b2524750456d0a579d7c35472ce1ea390f7376cf36b37","mode":"AES256"}}',
      encrypted_auth_token:
        '{"data":"4ac28f20c7aae9550197d01642c7f416fa58f88c0370b5231bb5eba069a6d3a7edff496f119596829965e5ac27d4125be5330ed31c8f5807e97fa94f16c72f12","metadata":{"iv":"9091535af1c48a55f39c1559eeb4fa3b","ephemPublicKey":"04ba7b3698082678abc12834e4595d8fc3c3f5cbfc64abdaff8d70e52f0491e20545dafeffffc4d80c70565a105c8849ef2145dd6fd023d5c1634b283282a16ef6","mac":"768cf14a53fd022911b0cd29dadbe9c6daca3ac21aaad333438e4c4ec7565ec3","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 1,
      sss_endpoint: 'https://node-1.dev-node.web3auth.io/sss/jrpc',
    },
    {
      encrypted_share:
        '{"data":"582107095e96efdc55de2d723a302e9be2323dc66135584f0b87c6b21f19d7bebe15485e9b3665ff85bf2cb72b9f291e","metadata":{"iv":"d0f338d79144c1fcff805f2487241fb6","ephemPublicKey":"042d1bc11f96462f87f2e03a005a8c728b52545233535e738374d982922fb094c94ede5e837e12193b5175689cb856c6301e818eecde3d9eda6b65f468cf06c1a1","mac":"46a1a5143be3c344dd80b3e3bc75833a6f1d4606fa2a59d1a51d1e2a200f7f16","mode":"AES256"}}',
      encrypted_auth_token:
        '{"data":"9a8e12896efc74b3c3040a247c51d9ce55663088af2244a0c3a412f749c399de8f2c9e661ae2dddc544e2c7a815b607c0959d4bf16449d6671fd6c499314f79e","metadata":{"iv":"c6766e81c8d1d050080995ea9ab17ab8","ephemPublicKey":"0468bac1c52fb311a18d70b9cf91718dd8df4208c3f8b57fbff989aad2702d4828f70d9e316fbf5bf6da2b046e8319a0a906cfaba998ece8509f230715da7f9769","mac":"5cd6c5107e256800c194440b45e7e2ee2c7f2d8c5d6873ac59bf53a7c58a5b70","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 2,
      sss_endpoint: 'https://node-2.dev-node.web3auth.io/sss/jrpc',
    },
    {
      encrypted_share:
        '{"data":"45fa6fb620689903a8b4ca1fcd51705dd774612ff2112c17c53b2e83195456550e0d3454eaf1b27e14c444a2a70e63db","metadata":{"iv":"c7f63079d3af524ebf28720ca15f5e65","ephemPublicKey":"04fcbea1708ff7bce488799978db6f8e8b58581c3c3acd9d03d60b87a30355ee599bd8f47e72ad13c94cb5f6d6ef3436d6be451c0d13c5ce21ac8982c699184637","mac":"c067d6fa8eb4e948b863f4ff2d7f6424ac9a84a80aee6662543b9dcc1be426f2","mode":"AES256"}}',
      encrypted_auth_token:
        '{"data":"7de929b97b52f1111576fa6f535eb4b06ad37707a031f24dadfb0ed53b30b358af335389d74a2e0fbd2e4c673cc44f469a8cff9132003c9331cee0c20e56ca13","metadata":{"iv":"d92727f0c6a96fce80e93f128443f391","ephemPublicKey":"0450f8f6ff9385a3e697103d9023b0d8ecfe52f96fa9d16a16d2195dfee4bc9d5e5c4261565ad175d48c6da728c94ae7e547b20eb87a5f391030a72600c73c4994","mac":"15a2340f3459baf0d18ac7aa802a6aa20faf206ec1024b25e30b15a4c2308731","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 3,
      sss_endpoint: 'https://node-3.dev-node.web3auth.io/sss/jrpc',
    },
    {
      encrypted_share:
        '{"data":"655f9043f003481719ee13b46c4e04e7c62b3286067f846508652f67fff7422e99abcd633eb049511e8bda54f705ce07","metadata":{"iv":"687b2f80120eed43482c98aa24330018","ephemPublicKey":"046d92016fc849af2c320d3a8f848e72ffe725ebd3ba9028974bbd1a1c03a91cd80f5da65406e0ddd78dbb9c2090a7b35f7e53525765fca18fdb05756fa97ab892","mac":"5f274a83a48b978e2620e071daa5178ec95ff741502cf4c866b3017b315f3f94","mode":"AES256"}}',
      encrypted_auth_token:
        '{"data":"afaedf6d7659f5b6f69ccc092f05bc36519c7401ff6a8c9b24aad2c7679aea16b0a695d2b053aa1bfa250cb12b8bdff78631b843420ce522026f1a42cc0d0815","metadata":{"iv":"f5b9b2f0a10bcda05faf916adbda6c3e","ephemPublicKey":"04488cc464c13019a9fd35f5c8067fd4f4bd4abd16673a275634ebad5f568082e735a19865dc8c86d09cc44f97a75a08a2eb23ecc4d1865fccc3e51a35ab769f16","mac":"32947746a3b885fe0776f3211c979c682edc4597839d3cbbf8d01d6e6ddd59d3","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 4,
      sss_endpoint: 'https://node-4.dev-node.web3auth.io/sss/jrpc',
    },
    {
      encrypted_share:
        '{"data":"5cde51b1be269fb1277edaf5fe2ff513a592ae7f573b03f6f04d37042d7a1035fb87f2393c032d275fc5c7de83917304","metadata":{"iv":"92438a912955ce1edc842e3b2f080d48","ephemPublicKey":"047a3450562425f59bb6595123a10dab307d304bfc45dbc4581c8ede5c296b69bd516dcdce813f08dbcab975738b71684732ff6476f07a9708c54bfdcd7359a0f3","mac":"642850083337bf7b9a8c1f67e918e192a58cee6866efeb15a55407a735485c2b","mode":"AES256"}}',
      encrypted_auth_token:
        '{"data":"13a0f9342b86059fdc37418bd2d5dedc5e95c95ee77e4e0d0d0cb76baf434684a534321e5910fe24b424068002e60a547deb1da0f05404de8caa3401d444634b","metadata":{"iv":"f0da416d5330a832cfce0ad389d331bb","ephemPublicKey":"04b0775622ff2685512b6a5a9936148484679c514f5406ddd693aab1795e1ab3eea3c6defa8fcb1af551cb74ea0096efec050fe044f089adc2886ee8a9f945988a","mac":"609b409347d3589116ef635dba59ac6ae393d4d55106bfd9fa3210511c049e7c","mode":"AES256"}}',
      key_share_index: 1,
      node_index: 5,
      sss_endpoint: 'https://node-5.dev-node.web3auth.io/sss/jrpc',
    },
  ],
};

// used to encrypt the SecretData (Seed Phrase, Private Key, etc.)
export const InitialMockEncryptionKey = new Uint8Array([
  178, 255, 51, 33, 212, 66, 206, 202, 159, 154, 43, 149, 176, 145, 103, 252,
  73, 194, 181, 254, 61, 207, 217, 213, 198, 247, 182, 19, 181, 59, 196, 123,
]);

// used to encrypt the Old encryption key during password change
export const NewMockPwdEncryptionKeyAfterPasswordChange = new Uint8Array([
  214, 244, 30, 35, 54, 75, 114, 95, 131, 18, 136, 3, 155, 172, 60, 9, 225, 189,
  127, 189, 135, 49, 226, 4, 138, 59, 220, 157, 139, 71, 15, 109,
]);
