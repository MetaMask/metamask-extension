# Using the TREZOR simulator

You can install the TREZOR emulator and use it with Metamask. 
Here is how:

## 1 - Install the TREZOR Bridge

Download the corresponding bridge for your platform from [this url](https://wallet.trezor.io/data/bridge/latest/index.html)

## 2 - Download and build the simulator

Follow this instructions: https://github.com/trezor/trezor-core/blob/master/docs/build.md

## 3 - Restart the bridge with emulator support (Mac OSx instructions)

`
    # stop any existing instance of trezord
    killall trezord

    # start the bridge for the simulator
    /Applications/Utilities/TREZOR\ Bridge/trezord -e 21324 >> /dev/null 2>&1 &

    # launch the emulator
    ~/trezor-core/emu.sh
`
