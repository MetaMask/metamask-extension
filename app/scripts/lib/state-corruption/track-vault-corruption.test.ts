import { segment } from '../segment';
import { VaultCorruptionType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../stores/persistence-manager';
import { trackVaultCorruptionEvent } from './track-vault-corruption';

jest.mock('../segment', () => ({
  segment: {
    track: jest.fn(),
    flush: jest.fn(),
  },
}));

const mockSegment = segment as jest.Mocked<typeof segment>;

const backupWithConsent: Backup = {
  KeyringController: { vault: 'encrypted-vault-data' },
  AppMetadataController: {},
  MetaMetricsController: {
    participateInMetaMetrics: true,
    metaMetricsId: 'test-metrics-id-123',
  },
};

describe('trackVaultCorruptionEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user has opted in to MetaMetrics', () => {
    it('tracks VaultCorruptionDetected event', () => {
      trackVaultCorruptionEvent(
        backupWithConsent,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).toHaveBeenCalledWith({
        userId: 'test-metrics-id-123',
        event: MetaMetricsEventName.VaultCorruptionDetected,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          vault_corruption_type: VaultCorruptionType.MissingVaultInDatabase,
          category: MetaMetricsEventCategory.Error,
        },
        context: {
          app: {
            name: 'MetaMask Extension',
            version: process.env.METAMASK_VERSION,
          },
        },
      });
      expect(mockSegment.flush).toHaveBeenCalled();
    });

    it('tracks VaultCorruptionRestoreWalletScreenViewed event', () => {
      trackVaultCorruptionEvent(
        backupWithConsent,
        MetaMetricsEventName.VaultCorruptionRestoreWalletScreenViewed,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).toHaveBeenCalledWith({
        userId: 'test-metrics-id-123',
        event: MetaMetricsEventName.VaultCorruptionRestoreWalletScreenViewed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          vault_corruption_type: VaultCorruptionType.MissingVaultInDatabase,
          category: MetaMetricsEventCategory.Error,
        },
        context: {
          app: {
            name: 'MetaMask Extension',
            version: process.env.METAMASK_VERSION,
          },
        },
      });
      expect(mockSegment.flush).toHaveBeenCalled();
    });

    it('tracks VaultCorruptionRestoreWalletButtonPressed event', () => {
      trackVaultCorruptionEvent(
        backupWithConsent,
        MetaMetricsEventName.VaultCorruptionRestoreWalletButtonPressed,
        VaultCorruptionType.UnaccessibleDatabase,
      );

      expect(mockSegment.track).toHaveBeenCalledWith({
        userId: 'test-metrics-id-123',
        event: MetaMetricsEventName.VaultCorruptionRestoreWalletButtonPressed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          vault_corruption_type: VaultCorruptionType.UnaccessibleDatabase,
          category: MetaMetricsEventCategory.Error,
        },
        context: {
          app: {
            name: 'MetaMask Extension',
            version: process.env.METAMASK_VERSION,
          },
        },
      });
      expect(mockSegment.flush).toHaveBeenCalled();
    });

    it('flushes immediately after tracking', () => {
      trackVaultCorruptionEvent(
        backupWithConsent,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('when user has NOT opted in to MetaMetrics', () => {
    it('does not track when participateInMetaMetrics is false', () => {
      const backup: Backup = {
        KeyringController: { vault: 'encrypted-vault-data' },
        AppMetadataController: {},
        MetaMetricsController: {
          participateInMetaMetrics: false,
          metaMetricsId: 'test-metrics-id-123',
        },
      };

      trackVaultCorruptionEvent(
        backup,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockSegment.flush).not.toHaveBeenCalled();
    });

    it('does not track when participateInMetaMetrics is null', () => {
      const backup: Backup = {
        KeyringController: { vault: 'encrypted-vault-data' },
        AppMetadataController: {},
        MetaMetricsController: {
          participateInMetaMetrics: null,
          metaMetricsId: 'test-metrics-id-123',
        },
      };

      trackVaultCorruptionEvent(
        backup,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockSegment.flush).not.toHaveBeenCalled();
    });

    it('does not track when metaMetricsId is null', () => {
      const backup: Backup = {
        KeyringController: { vault: 'encrypted-vault-data' },
        AppMetadataController: {},
        MetaMetricsController: {
          participateInMetaMetrics: true,
          metaMetricsId: null,
        },
      };

      trackVaultCorruptionEvent(
        backup,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockSegment.flush).not.toHaveBeenCalled();
    });

    it('does not track when metaMetricsId is missing', () => {
      const backup: Backup = {
        KeyringController: { vault: 'encrypted-vault-data' },
        AppMetadataController: {},
        MetaMetricsController: {
          participateInMetaMetrics: true,
        },
      };

      trackVaultCorruptionEvent(
        backup,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockSegment.flush).not.toHaveBeenCalled();
    });
  });

  describe('when backup is null or missing MetaMetricsController', () => {
    it('does not track when backup is null', () => {
      trackVaultCorruptionEvent(
        null,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockSegment.flush).not.toHaveBeenCalled();
    });

    it('does not track when MetaMetricsController is missing from backup', () => {
      const backup: Backup = {
        KeyringController: { vault: 'encrypted-vault-data' },
        AppMetadataController: {},
      };

      trackVaultCorruptionEvent(
        backup,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockSegment.flush).not.toHaveBeenCalled();
    });

    it('does not track when MetaMetricsController is undefined', () => {
      const backup: Backup = {
        KeyringController: { vault: 'encrypted-vault-data' },
        AppMetadataController: {},
        MetaMetricsController: undefined,
      };

      trackVaultCorruptionEvent(
        backup,
        MetaMetricsEventName.VaultCorruptionDetected,
        VaultCorruptionType.MissingVaultInDatabase,
      );

      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockSegment.flush).not.toHaveBeenCalled();
    });
  });
});
