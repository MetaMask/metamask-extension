
import { SnapsRegistryRequest, SnapsRegistry, SnapsRegistryResult, SnapsRegistryInfo, SnapsRegistryStatus } from '@metamask/snaps-controllers';
import { SnapId } from '@metamask/snaps-utils';
import { GOERLI_RPC_URL } from '../../../../shared/constants/network';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

const SNAPS_REGISTRY_ADDRESS = '0xD9a7DE6F9D009c1B99bc7A2C438C93417bb0CdE7';
const SNAPS_REGISTRY_NETWORK_URL = GOERLI_RPC_URL;
const SNAPS_REGISTRY_ABI = [
  'function snapStatus(string memory snapId, string memory version) public view returns(uint8)'
];

// Reason message for a given audit status
enum StatusReasonMessage {
  Unverified = 'This Snap hasn\'t been verified',
  Paused = 'This Snap has been paused',
  Blocked = 'This Snap is blocked',
  Depracted = 'This Snap is deprecated',
  Unregistered = 'This Snap hasn\'t been registered'
};

// Trust level which conditions the level of verification require before installing snaps
enum SnapsTrustLevel {
  AuditedOnly,
  SafeAccessOnly,
  Open
};

// Information to connect to the audit trail smart contract
export declare type RegistryContractInfo = {
  networkRpcUrl: string;
  address: string;
};

// Arguments of the DecentralizedSnapsRegistry constructor
export type DecentralizedSnapsRegistryArgs = {
  snapsTrustLevel?: SnapsTrustLevel;
  registryContractInfo?: RegistryContractInfo; 
  failOnUnavailableRegistry?: boolean;
};

/**
 * Implementation of the Snaps Registry smart contract based
 */
export class DecentralizedSnapsRegistry implements SnapsRegistry {

  #snapsTrustLevel: SnapsTrustLevel;
  #registryContractInfo: RegistryContractInfo;
  #contract: any;
  #failOnUnavailableRegistry: boolean;

  constructor({
    registryContractInfo = {networkRpcUrl: SNAPS_REGISTRY_NETWORK_URL, address: SNAPS_REGISTRY_ADDRESS},
    snapsTrustLevel = SnapsTrustLevel.AuditedOnly, 
    failOnUnavailableRegistry = true }: DecentralizedSnapsRegistryArgs = {}) 
  {
    this.#failOnUnavailableRegistry = failOnUnavailableRegistry;
    this.#snapsTrustLevel = snapsTrustLevel;
    this.#registryContractInfo = registryContractInfo;
    this.#contract = null;
  }

    /**
   * Identifies blocked snaps among the snaps requested by fetching their status within the decentralized snaps registry
   * @param snaps Snaps requested to be installed (`SnapId` => {`version`, `checksum`})
   * @returns Blocked snaps among the snaps requested to be installed (`SnapId` => {`status`, `reason`})
   */
  public async get(snaps: SnapsRegistryRequest): Promise<Record<SnapId, SnapsRegistryResult>> {

    this.#contract = await this.getSnapsRegistryContract();

    // Verify if a compliant snaps registry contract is available
    if (this.#contract != null) {
      console.log('log: The snaps trust level is configured to ', this.#snapsTrustLevel);
      if (this.#snapsTrustLevel == SnapsTrustLevel.AuditedOnly) {
        return await Object.entries(snaps).reduce<Promise<Record<SnapId, SnapsRegistryResult>>>(async (accumulator, [snapId, snapInfo]) => {
          console.log('log: Verification of the following Snap 🔎🔎🔎: ' + snapId + ' version ' + snapInfo.version);
          const result = await this.getSnapStatus(snapId, snapInfo);
          (await accumulator)[snapId] = result;
          return accumulator; 
        }, Promise.resolve({}));
      } else if (this.#snapsTrustLevel == SnapsTrustLevel.SafeAccessOnly) {
        return Promise.resolve({}); // TODO
      } else {
        return Promise.resolve({});
      }

    // Verify if the availability of the registry is mantadory to install snaps
    } else if (this.#failOnUnavailableRegistry) {
      throw new Error('The configured snaps registry is unavailable, snaps installation blocked ☠️☠️☠️');
    } else {
      return Promise.resolve({});
    }
  }

  /**
   * Read the status of a given snap version within the decentralized snaps registry
   * @param snapId Snap identifier
   * @param snapInfo Snap information (`version`, `checksum`)
   * @returns Snap status and the related reason (`status`, `reason)
   */
  public async getSnapStatus(snapId: SnapId, snapInfo: SnapsRegistryInfo) {
    try {
      // Try to retrieve the Snap's status
      const status = await this.#contract.snapStatus(snapId, snapInfo.version);
      console.log('log: Status of the snap is: ', status);

      // Return the Snap blocked status and the status reason
      switch (status) {
        case 0 : return { status: SnapsRegistryStatus.Unverified, reason: { explanation: StatusReasonMessage.Unverified } };
        case 2 : return { status: SnapsRegistryStatus.Blocked, reason: { explanation: StatusReasonMessage.Paused } };
        case 3 : return { status: SnapsRegistryStatus.Blocked, reason: { explanation: StatusReasonMessage.Blocked } };
        case 4 : return { status: SnapsRegistryStatus.Blocked, reason: { explanation: StatusReasonMessage.Depracted } };
        default : return { status: SnapsRegistryStatus.Blocked, reason: { explanation: StatusReasonMessage.Unregistered } };
      }
    } catch (e)  {
      throw new Error('Snaps registry interfaces are not compliant ☠️☠️☠️');
    }
  }

  public async getSnapsRegistryContract(): Promise<Contract | null> {
    try {
      // Connect to a Decentralized Network to access the Snaps Registry
      const provider = new JsonRpcProvider(this.#registryContractInfo.networkRpcUrl);
      console.log('log: Connection to the configured Decentralized Network 🚀🚀🚀 ', this.#registryContractInfo.networkRpcUrl);

      // Verify the existance of the snaps registry
      console.log('log: Verification of the availability of the Snaps Registry Smart Contract ☠️☠️☠️');
      const isRegistryAvailable = await provider.getCode(this.#registryContractInfo.address) != '0x';
      
      // Create the contract instance if the registry is available
      if (isRegistryAvailable) {
        console.log('log: Connection to the Snaps Registry Smart Contract 🚀🚀🚀');
        return new Contract(this.#registryContractInfo.address, SNAPS_REGISTRY_ABI, provider);
      } else {
        return null;
      }
    } catch (e) {
      console.log('log: Connection to the Decentralized Network failed ☠️☠️☠️');
      return null;
    }
  }
}
