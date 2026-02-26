import { merge, cloneDeep } from 'lodash';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import type {
  PermissionConstraint,
  PermissionControllerState,
} from '@metamask/permission-controller';
import type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
import type {
  Preferences,
  PreferencesControllerState,
} from '../../../app/scripts/controllers/preferences-controller';
import {
  DAPP_URL,
  DAPP_URL_LOCALHOST,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
  SOLANA_MAINNET_SCOPE,
} from '../constants';
import defaultFixtureJson from './default-fixture.json';
import onboardingFixtureJson from './onboarding-fixture.json';

function defaultFixture() {
  return cloneDeep(defaultFixtureJson);
}

function onboardingFixture() {
  return cloneDeep(onboardingFixtureJson);
}

type FixtureType = typeof defaultFixtureJson | typeof onboardingFixtureJson;

class FixtureBuilderV2 {
  fixture: FixtureType;

  /**
   * Constructs a new instance of the FixtureBuilder class.
   *
   * @param options - The options for the constructor.
   * @param options.onboarding - Indicates if onboarding is enabled.
   */
  constructor({ onboarding = false }: { onboarding?: boolean } = {}) {
    this.fixture = onboarding === true ? onboardingFixture() : defaultFixture();
  }

  /* ==================================================================
                          GENERIC  CONTROLLER METHODS
     ==================================================================
  */
  withAddressBookController(data: Partial<AddressBookControllerState>): this {
    if (!this.fixture.data.AddressBookController) {
      (this.fixture.data as Record<string, unknown>).AddressBookController = {
        addressBook: {},
      };
    }
    merge(this.fixture.data.AddressBookController, data);
    return this;
  }

  withCurrencyController(data: Partial<CurrencyRateState>): this {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withPermissionController(
    data: Partial<PermissionControllerState<PermissionConstraint>>,
  ): this {
    merge(this.fixture.data.PermissionController, data);
    return this;
  }

  withPreferencesController(
    data: Omit<Partial<PreferencesControllerState>, 'preferences'> & {
      preferences?: Partial<Preferences>;
    },
  ): this {
    merge(this.fixture.data.PreferencesController, data);
    return this;
  }

  /* ==================================================================
                              CUSTOM METHODS
     ==================================================================
  */
  withConversionRateDisabled(): this {
    return this.withPreferencesController({
      useCurrencyRateCheck: false,
    });
  }

  withEnabledNetworks(
    data: NetworkEnablementControllerState['enabledNetworkMap'],
  ): this {
    this.fixture.data.NetworkEnablementController.enabledNetworkMap =
      data as FixtureType['data']['NetworkEnablementController']['enabledNetworkMap'];
    return this;
  }

  withPermissionControllerConnectedToTestDapp({
    account = '',
    useLocalhostHostname = false,
  }: {
    account?: string;
    useLocalhostHostname?: boolean;
  } = {}): this {
    const selectedAccount = account
      ? account.toLowerCase()
      : DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
    const dappUrl = useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL;

    // Derive optionalScopes from the EVM networks in state
    const optionalScopes: Record<string, { accounts: string[] }> = {};

    const networkConfigs =
      this.fixture.data.NetworkController?.networkConfigurationsByChainId || {};
    Object.entries(networkConfigs).forEach(([chainIdHex]) => {
      // Convert hex chainId (0x1) to decimal for CAIP-2 format (eip155:1)
      const chainId = parseInt(chainIdHex, 16);
      const scopeKey = `eip155:${chainId}`;
      optionalScopes[scopeKey] = {
        accounts: [`${scopeKey}:${selectedAccount}`],
      };
    });

    // Add Solana Mainnet scope
    optionalScopes[SOLANA_MAINNET_SCOPE] = {
      accounts: [`${SOLANA_MAINNET_SCOPE}:${DEFAULT_FIXTURE_SOLANA_ACCOUNT}`],
    };

    // Add wallet:eip155 scope
    optionalScopes['wallet:eip155'] = {
      accounts: [],
    };

    return this.withPermissionController({
      subjects: {
        [dappUrl]: {
          origin: dappUrl,
          permissions: {
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: {
                    isMultichainOrigin: true,
                    optionalScopes,
                    requiredScopes: {},
                    sessionProperties: {},
                  },
                },
              ],
              date: 1770296204693,
              id: 'SFqk8nFLekiqC5O1cYCjT',
              invoker: dappUrl,
              parentCapability: 'endowment:caip25',
            },
          },
        },
      },
    });
  }

  withKeyringController(
    data: Partial<FixtureType['data']['KeyringController']>,
  ): this {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  /**
   * Add a keyring controller with a vault that contains multiple SRP keyrings.
   */
  withKeyringControllerMultiSRP(): this {
    return this.withKeyringController({
      vault:
        '{"data":"tM9QywcUa46iRvWsfvOL9mJqOrRLoVZoDuqTwxEt1Jz4qCpVIx8I/+7wMQuHBhe+DLBMSB7DzWeBpkCngTSE/mt6ygXWd96aKPH00PCW7uq/Z+8gdHQ3+ZGVCkTIDvLwOzG2gywrOfWRzRRcFwV545EV2iC6Q47A6KcgK/YokBeT4uVJ+oC309490eYn6/LkC+e+DNzJOlESs0LOynMJPMP0Wc53AvEuVlmYA2QLUKa+X6Eo1FEm91lg7znnNGTH7d7PVzDjElTQAUcQmiCvLfJU3cCmnVubarG/eOPWyL41u1z2IFMuf2QKoJNG7garFS+z4THtqWuR/NiYbNCJ70G6V2P0+9ntIWMk4qs4cBY4Pl3MPsyXBVhVoL+sLmuguY6iPijQVcPtd8G1HjTWOXNAVYSrdXjd4YHJuBBqgrjsqkkCHknilv6BiyHFH+pURP7zuPley9hiru5szuaKKU4NtpawQe0STQO5X35fI2xrH603etO9lhlK9lU+eFA+6jO0EynA1+HDIWT8iqX0gaOF6aPR/K1EKzbveP+EQbj7vIpOQs2+EJ4F4LYkExKczpvacgci84sLWGeT1e/aP1/dsVjuApUo0mtJaUtbljSvWoGuh6y8orTt6voyvHvbA+atPX+jla0/rWwy1lJ8o6PoXnyBMsgS+DSSamqXeMRKPI4S6GWiAMxLmvJvOEiC/uYRLrCzE0RxjIP9W6f2K+0VhAXJjPBp/t32NeHiwBfVeitdPwZUmMfhqzE0gvXyAd6cfzEnlyICfS8/DQkn74GDbdd1MdikdETCutDpiGEshacQT/scy0Z6n/5vuKkAGgrW66m39Ewqz6H2Rida5zgx1esrwZFy+8H57M2fa9KPa3ddye6J5Cd00JiqK/HiT20Uzt4h725iLNdkDrDT/mLlIGwbcSsSZxpTCYjtAAcN5JtWZNIp6xPOT889Tg9u3hHNy3g3VhVbYevtfTnVSgFFi+9B1JZ1OhL4NZC8bjyeNJ1pOUyLRZiRhgQ8aJPv5QytwDth+pJBvQslQ5UlrbhHRyd0RC0YrcyQ3WbapuDlJtdkkDuQg0OvevX+3F/Z/84uWvJ9qWBPkbOcn+ydULRDDouBmwsHqyY=","iv":"CR5flTdOsO77up6hbd8qQA==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"VY02O4NjlOhOKZI0/WPievKNVo2vOcg237YR5MrUW+c="}',
    });
  }

  withMetaMetricsController(
    data: Partial<FixtureType['data']['MetaMetricsController']>,
  ): this {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withSnapController(
    data: Partial<FixtureType['data']['SnapController']>,
  ): this {
    (this.fixture.data as Record<string, unknown>).SnapController ??= {};
    merge(this.fixture.data.SnapController, data);
    return this;
  }

  withSnapControllerOnStartLifecycleSnap(): this {
    return this.withPermissionController({
      subjects: {
        'npm:@metamask/lifecycle-hooks-example-snap': {
          origin: 'npm:@metamask/lifecycle-hooks-example-snap',
          permissions: {
            'endowment:lifecycle-hooks': {
              caveats: null,
              date: 1750244440562,
              id: '0eKn8SjGEH6o_6Mhcq3Lw',
              invoker: 'npm:@metamask/lifecycle-hooks-example-snap',
              parentCapability: 'endowment:lifecycle-hooks',
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention -- snap_dialog is Snaps API permission name
            snap_dialog: {
              caveats: null,
              date: 1750244440562,
              id: 'Fbme_UWcuSK92JqfrT4G2',
              invoker: 'npm:@metamask/lifecycle-hooks-example-snap',
              parentCapability: 'snap_dialog',
            },
          },
        },
      },
    }).withSnapController({
      snaps: {
        'npm:@metamask/lifecycle-hooks-example-snap': {
          auxiliaryFiles: [],
          blocked: false,
          enabled: true,
          id: 'npm:@metamask/lifecycle-hooks-example-snap',
          initialPermissions: {
            'endowment:lifecycle-hooks': {},
            // eslint-disable-next-line @typescript-eslint/naming-convention -- snap_dialog is Snaps API permission name
            snap_dialog: {},
          },
          localizationFiles: [],
          manifest: {
            description:
              'MetaMask example snap demonstrating the use of the `onStart`, `onInstall`, and `onUpdate` lifecycle hooks.',
            initialPermissions: {
              'endowment:lifecycle-hooks': {},
              // eslint-disable-next-line @typescript-eslint/naming-convention -- snap_dialog is Snaps API permission name
              snap_dialog: {},
            },
            manifestVersion: '0.1',
            platformVersion: '8.1.0',
            proposedName: 'Lifecycle Hooks Example Snap',
            repository: {
              type: 'git',
              url: 'https://github.com/MetaMask/snaps.git',
            },
            source: {
              location: {
                npm: {
                  filePath: 'dist/bundle.js',
                  packageName: '@metamask/lifecycle-hooks-example-snap',
                  registry: 'https://registry.npmjs.org',
                },
              },
              shasum: '5tlM5E71Fbeid7I3F0oQURWL7/+0620wplybtklBCHQ=',
            },
            version: '2.2.0',
          },
          /* Minified snap source - contains literal "${String(e)}" from bundled code */
          /* eslint-disable no-template-curly-in-string */
          sourceCode:
            '(()=>{var e={d:(n,t)=>{for(var a in t)e.o(t,a)&&!e.o(n,a)&&Object.defineProperty(n,a,{enumerable:!0,get:t[a]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},n={};(()=>{"use strict";function t(e,n,t){if("string"==typeof e)throw new Error(`An HTML element ("${String(e)}") was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.`);if(!e)throw new Error("A JSX fragment was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.");return e({...n,key:t})}function a(e){return Object.fromEntries(Object.entries(e).filter((([,e])=>void 0!==e)))}function r(e){return n=>{const{key:t=null,...r}=n;return{type:e,props:a(r),key:t}}}e.r(n),e.d(n,{onInstall:()=>p,onStart:()=>l,onUpdate:()=>d});const o=r("Box"),s=r("Text"),l=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The client was started successfully, and the "onStart" handler was called.\'})})}}),p=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was installed successfully, and the "onInstall" handler was called.\'})})}}),d=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was updated successfully, and the "onUpdate" handler was called.\'})})}})})(),module.exports=n})();',
          /* eslint-enable no-template-curly-in-string */
          status: 'stopped',
          version: '2.2.0',
          versionHistory: [
            {
              date: 1750244439310,
              origin: 'https://metamask.github.io',
              version: '2.2.0',
            },
          ],
        },
      },
    });
  }

  build() {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
