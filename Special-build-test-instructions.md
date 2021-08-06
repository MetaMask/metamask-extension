# Instructions for testing MetaMask Extension v10.0.0 Release Candidate (RC)

## Download the RC file

Our RC builds are automatically posted here as we update the RC: https://github.com/MetaMask/metamask-extension/pull/11731

- [Most Recent Chrome Download](https://322850-42009758-gh.circle-artifacts.com/0/builds/metamask-chrome-10.0.0.zip)
- [Most Recent Firefox download](https://322850-42009758-gh.circle-artifacts.com/0/builds/metamask-firefox-10.0.0.zip)

## Chrome specific instructions

### Disable your current MetaMask OR create a new chrome profile

Having two MetaMask's installed at once can cause errors and a broken user experience. It is best to either temporarily enable your current install, or add MetaMask in a new chrome profile (or even another browser).

*To temprarily disable:*

- go to chrome://extensions/
- toggle off "MetaMask" (click the blue toggle switch)

*To create a new profile:*

- click the avatar in the top right of your chrome browser
- click "Add", and complete the following steps

Alternatively, you could add a different build of chrome, or a browser like brave, and install the RC build there

### Turn on developer mode for chrome extensions

- Go to chrome://extensions
- toggle on "Developer Mode" in the top right

### Drag and drop the metamask-chrome-10.0.0.zip into chrome://extensions

Take the file you downloaded in the first step and drag and drop it into the chrome://extensions page

## Firefox specific instructions

### Disable your current MetaMask OR install create a new chrome profile

Having two MetaMask's installed at once can cause errors and a broken user experience. It is best to either temporarily enable your current install, or add MetaMask in a new chrome profile (or even another browser).

*To temprarily disable:*

- go to about:addons
- toggle off "MetaMask" (click the blue toggle switch)

Alternatively, you could add a different build of firefox (e.g. firefox nightly), and install there

### Install a temporary addon

- got to about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-on..."
- Select the metamask-firefox-10.0.0.zip file you downloaded in the first step above

## Video Walkthrough

A 90 seconds video walk through of the above process is available here:

Chrome:
https://user-images.githubusercontent.com/7499938/128045635-259484bd-5976-4b1c-86b0-3eca491d5ed4.mp4

Firefox:
https://user-images.githubusercontent.com/7499938/128045644-2a9c9748-c5f6-4861-a098-8a54d9c16404.mp4
