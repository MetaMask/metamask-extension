import {
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
} from '@ledgerhq/device-management-kit';

export const dmk: DeviceManagementKit = new DeviceManagementKitBuilder()
  .addLogger(new ConsoleLogger())
  .build();
