/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import GanacheContractAddressRegistry from '../../../seeder/ganache-contract-address-registry';
import { DAPP_URL, unlockWallet, WINDOW_TITLES } from '../../../helpers';
import TestDapp from '../../../page-objects/pages/test-dapp';
import MintNftTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/mint-nft-confirmation';
import { TestSuiteArguments } from './shared';

const { defaultGanacheOptions, withFixtures } = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign Contract Interaction Transaction Decoding', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  describe('Create a mint nft transaction @no-mmi', function () {
    it(`decodes 4 bytes transaction data`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          testSpecificMock: mocked4BytesResponse,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await unlockWallet(driver);
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);

          const testDapp = new TestDapp(driver);
          const mintNftTransactionConfirmation =
            new MintNftTransactionConfirmation(driver);

          await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

          await testDapp.clickERC721MintButton();

          await driver.waitAndSwitchToWindowWithTitle(3, WINDOW_TITLES.Dialog);

          await mintNftTransactionConfirmation.clickAdvancedDetailsButton();
          await mintNftTransactionConfirmation.verifyAdvancedDetailsIsDisplayed(
            '4Bytes',
          );
        },
      );
    });
  });

  it(`decodes sourcify transaction data`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              redesignedConfirmationsEnabled: true,
              isRedesignedConfirmationsDeveloperEnabled: true,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        testSpecificMock: mockedSourcifyResponse,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await unlockWallet(driver);
        const contractAddress = await (
          contractRegistry as GanacheContractAddressRegistry
        ).getContractAddress(smartContract);

        const testDapp = new TestDapp(driver);
        const mintNftTransactionConfirmation =
          new MintNftTransactionConfirmation(driver);

        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

        await testDapp.clickERC721MintButton();
        await driver.waitAndSwitchToWindowWithTitle(3, WINDOW_TITLES.Dialog);

        await mintNftTransactionConfirmation.clickAdvancedDetailsButton();
        await mintNftTransactionConfirmation.verifyAdvancedDetailsIsDisplayed(
          'Sourcify',
        );
      },
    );
  });

  it(`falls back to raw hexadecimal when no data is retreived`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              redesignedConfirmationsEnabled: true,
              isRedesignedConfirmationsDeveloperEnabled: true,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await unlockWallet(driver);
        const contractAddress = await (
          contractRegistry as GanacheContractAddressRegistry
        ).getContractAddress(smartContract);

        const testDapp = new TestDapp(driver);
        const mintNftTransactionConfirmation =
          new MintNftTransactionConfirmation(driver);

        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

        await testDapp.clickERC721MintButton();
        await driver.waitAndSwitchToWindowWithTitle(3, WINDOW_TITLES.Dialog);

        await mintNftTransactionConfirmation.clickAdvancedDetailsButton();

        await mintNftTransactionConfirmation.verifyAdvancedDetailsHexDataIsDisplayed();
      },
    );
  });
});

async function mocked4BytesResponse(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .always()
    .withQuery({ hex_signature: '0x3b4b1381' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            created_at: '2021-09-14T02:07:09.805000Z',
            text_signature: 'mintNFTs(uint256)',
            hex_signature: '0x3b4b1381',
            bytes_signature: ';K\u0013',
          },
        ],
      },
    }));
}

export const SOURCIFY_RESPONSE = {
  files: [
    {
      name: 'metadata.json',
      path: 'contracts/partial_match/11155111/0x076146c765189d51bE3160A2140cF80BFC73ad68/metadata.json',
      content:
        '{"compiler":{"version":"0.8.18+commit.87f61d96"},"language":"Solidity","output":{"abi":[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"currentTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"numberOfTokens","type":"uint256"}],"name":"mintNFTs","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}],"devdoc":{"events":{"Approval(address,address,uint256)":{"details":"Emitted when `owner` enables `approved` to manage the `tokenId` token."},"ApprovalForAll(address,address,bool)":{"details":"Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets."},"Transfer(address,address,uint256)":{"details":"Emitted when `tokenId` token is transferred from `from` to `to`."}},"kind":"dev","methods":{"approve(address,uint256)":{"details":"See {IERC721-approve}."},"balanceOf(address)":{"details":"See {IERC721-balanceOf}."},"getApproved(uint256)":{"details":"See {IERC721-getApproved}."},"isApprovedForAll(address,address)":{"details":"See {IERC721-isApprovedForAll}."},"name()":{"details":"See {IERC721Metadata-name}."},"ownerOf(uint256)":{"details":"See {IERC721-ownerOf}."},"safeTransferFrom(address,address,uint256)":{"details":"See {IERC721-safeTransferFrom}."},"safeTransferFrom(address,address,uint256,bytes)":{"details":"See {IERC721-safeTransferFrom}."},"setApprovalForAll(address,bool)":{"details":"See {IERC721-setApprovalForAll}."},"supportsInterface(bytes4)":{"details":"See {IERC165-supportsInterface}."},"symbol()":{"details":"See {IERC721Metadata-symbol}."},"tokenURI(uint256)":{"details":"See {IERC721Metadata-tokenURI}."},"transferFrom(address,address,uint256)":{"details":"See {IERC721-transferFrom}."}},"version":1},"userdoc":{"kind":"user","methods":{},"version":1}},"settings":{"compilationTarget":{"contracts/TestDappCollectibles.sol":"TestDappNFTs"},"evmVersion":"paris","libraries":{},"metadata":{"bytecodeHash":"ipfs"},"optimizer":{"enabled":false,"runs":200},"remappings":[]},"sources":{"@openzeppelin/contracts/token/ERC721/ERC721.sol":{"keccak256":"0x2c309e7df9e05e6ce15bedfe74f3c61b467fc37e0fae9eab496acf5ea0bbd7ff","license":"MIT","urls":["bzz-raw://7063b5c98711a98018ba4635ac74cee1c1cfa2ea01099498e062699ed9530005","dweb:/ipfs/QmeJ8rGXkcv7RrqLdAW8PCXPAykxVsddfYY6g5NaTwmRFE"]},"@openzeppelin/contracts/token/ERC721/IERC721.sol":{"keccak256":"0x5bce51e11f7d194b79ea59fe00c9e8de9fa2c5530124960f29a24d4c740a3266","license":"MIT","urls":["bzz-raw://7e66dfde185df46104c11bc89d08fa0760737aa59a2b8546a656473d810a8ea4","dweb:/ipfs/QmXvyqtXPaPss2PD7eqPoSao5Szm2n6UMoiG8TZZDjmChR"]},"@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol":{"keccak256":"0xa82b58eca1ee256be466e536706850163d2ec7821945abd6b4778cfb3bee37da","license":"MIT","urls":["bzz-raw://6e75cf83beb757b8855791088546b8337e9d4684e169400c20d44a515353b708","dweb:/ipfs/QmYvPafLfoquiDMEj7CKHtvbgHu7TJNPSVPSCjrtjV8HjV"]},"@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol":{"keccak256":"0x75b829ff2f26c14355d1cba20e16fe7b29ca58eb5fef665ede48bc0f9c6c74b9","license":"MIT","urls":["bzz-raw://a0a107160525724f9e1bbbab031defc2f298296dd9e331f16a6f7130cec32146","dweb:/ipfs/QmemujxSd7gX8A9M8UwmNbz4Ms3U9FG9QfudUgxwvTmPWf"]},"@openzeppelin/contracts/utils/Address.sol":{"keccak256":"0x006dd67219697fe68d7fbfdea512e7c4cb64a43565ed86171d67e844982da6fa","license":"MIT","urls":["bzz-raw://2455248c8ddd9cc6a7af76a13973cddf222072427e7b0e2a7d1aff345145e931","dweb:/ipfs/QmfYjnjRbWqYpuxurqveE6HtzsY1Xx323J428AKQgtBJZm"]},"@openzeppelin/contracts/utils/Context.sol":{"keccak256":"0xe2e337e6dde9ef6b680e07338c493ebea1b5fd09b43424112868e9cc1706bca7","license":"MIT","urls":["bzz-raw://6df0ddf21ce9f58271bdfaa85cde98b200ef242a05a3f85c2bc10a8294800a92","dweb:/ipfs/QmRK2Y5Yc6BK7tGKkgsgn3aJEQGi5aakeSPZvS65PV8Xp3"]},"@openzeppelin/contracts/utils/Counters.sol":{"keccak256":"0xf0018c2440fbe238dd3a8732fa8e17a0f9dce84d31451dc8a32f6d62b349c9f1","license":"MIT","urls":["bzz-raw://59e1c62884d55b70f3ae5432b44bb3166ad71ae3acd19c57ab6ddc3c87c325ee","dweb:/ipfs/QmezuXg5GK5oeA4F91EZhozBFekhq5TD966bHPH18cCqhu"]},"@openzeppelin/contracts/utils/Strings.sol":{"keccak256":"0x3088eb2868e8d13d89d16670b5f8612c4ab9ff8956272837d8e90106c59c14a0","license":"MIT","urls":["bzz-raw://b81d9ff6559ea5c47fc573e17ece6d9ba5d6839e213e6ebc3b4c5c8fe4199d7f","dweb:/ipfs/QmPCW1bFisUzJkyjroY3yipwfism9RRCigCcK1hbXtVM8n"]},"@openzeppelin/contracts/utils/introspection/ERC165.sol":{"keccak256":"0xd10975de010d89fd1c78dc5e8a9a7e7f496198085c151648f20cba166b32582b","license":"MIT","urls":["bzz-raw://fb0048dee081f6fffa5f74afc3fb328483c2a30504e94a0ddd2a5114d731ec4d","dweb:/ipfs/QmZptt1nmYoA5SgjwnSgWqgUSDgm4q52Yos3xhnMv3MV43"]},"@openzeppelin/contracts/utils/introspection/IERC165.sol":{"keccak256":"0x447a5f3ddc18419d41ff92b3773fb86471b1db25773e07f877f548918a185bf1","license":"MIT","urls":["bzz-raw://be161e54f24e5c6fae81a12db1a8ae87bc5ae1b0ddc805d82a1440a68455088f","dweb:/ipfs/QmP7C3CHdY9urF4dEMb9wmsp1wMxHF6nhA2yQE5SKiPAdy"]},"@openzeppelin/contracts/utils/math/Math.sol":{"keccak256":"0xe4455ac1eb7fc497bb7402579e7b4d64d928b846fce7d2b6fde06d366f21c2b3","license":"MIT","urls":["bzz-raw://cc8841b3cd48ad125e2f46323c8bad3aa0e88e399ec62acb9e57efa7e7c8058c","dweb:/ipfs/QmSqE4mXHA2BXW58deDbXE8MTcsL5JSKNDbm23sVQxRLPS"]},"@openzeppelin/contracts/utils/math/SignedMath.sol":{"keccak256":"0xf92515413956f529d95977adc9b0567d583c6203fc31ab1c23824c35187e3ddc","license":"MIT","urls":["bzz-raw://c50fcc459e49a9858b6d8ad5f911295cb7c9ab57567845a250bf0153f84a95c7","dweb:/ipfs/QmcEW85JRzvDkQggxiBBLVAasXWdkhEysqypj9EaB6H2g6"]},"base64-sol/base64.sol":{"keccak256":"0xa73959e6ef0b693e4423a562e612370160b934a75e618361ddd8c9c4b8ddbaaf","license":"MIT","urls":["bzz-raw://17c12e16d8d66f3af15d8787920bd41ca6c1e7517a212a6b9cebd4b6d38f36fe","dweb:/ipfs/QmcXMnZUXEz6LRKsm3CSvqdPboAzmezavi8bTg2dRxM2yE"]},"contracts/TestDappCollectibles.sol":{"keccak256":"0x3d2fa0d37970b903e628d8a7b101f8f73513d41d917fbdfac2749d9d1214176c","license":"MIT","urls":["bzz-raw://e01f3a25371accdfbbc2e3c9aeceabf92c5158f318a5e3f5b6c2b6ea3edb0c3b","dweb:/ipfs/QmT89aSnmzTdpRpoCoqCmnrR3Lp7CyXFtpnn2P52YEJULD"]}},"version":1}',
    },
  ],
};

async function mockedSourcifyResponse(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://sourcify.dev/server/files/any/1337/0x')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: SOURCIFY_RESPONSE,
    }));
}
