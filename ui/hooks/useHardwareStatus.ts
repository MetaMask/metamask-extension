import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  HardwareDeviceNames,
  HardwareKeyringType,
} from 'shared/constants/hardware-wallets';
import { isAddressHardware } from 'ui/ducks/metamask/metamask';
import { submitRequestToBackground } from 'ui/store/action-queue';

const HARDWARE_POLLING = 5000;

type ActiveHardwareStatus = {
  isActive: true;
  usingHardware: true;
  deviceName: HardwareDeviceNames;
};

type InactiveHardwareStatus = {
  isActive: false;
  usingHardware: true;
  deviceName: HardwareDeviceNames;
};

type NoHardwareStatus = {
  isActive: false;
  usingHardware: false;
};

type HardwareStatusResult =
  | ActiveHardwareStatus
  | InactiveHardwareStatus
  | NoHardwareStatus;

function getDefaultHDPath(deviceName: string) {
  switch (deviceName) {
    case HardwareKeyringType.ledger:
      return `m/44'/60'/0'/0/0`;
    case HardwareKeyringType.trezor:
      return `m/44'/60'/0'/0`;
    case HardwareKeyringType.lattice:
      return `m/44'/60'/0'/0/0`;
    default:
      return `m/44'/60'/0'/0/0`;
  }
}

export function useHardwareStatus({
  address,
}: {
  address: string;
}): HardwareStatusResult {
  const [isActive, setIsActive] = useState(false);
  const { usingHardware, deviceName } = useSelector((state) =>
    isAddressHardware(state, address),
  );

  if (!usingHardware || !deviceName) {
    return {
      isActive: false,
      usingHardware: false,
    };
  }

  const updateHardwareState = useCallback(async () => {
    const hdPath = getDefaultHDPath(deviceName);
    const hardwareStatus = await submitRequestToBackground<boolean>(
      'checkHardwareStatus',
      [deviceName, hdPath],
    );
    if (hardwareStatus) {
      setIsActive(true);
    }
  }, [usingHardware, deviceName]);

  useEffect(() => {
    if (usingHardware) {
      setInterval(() => {
        const pollingID = setInterval(updateHardwareState, HARDWARE_POLLING);

        return () => clearInterval(pollingID);
      });
    }
  }, [usingHardware]);

  return {
    isActive,
    usingHardware,
    deviceName,
  };
}
