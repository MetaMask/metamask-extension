## Add Custom Build to Chrome

![Load dev build](./load-dev-build-chrome.gif)

* Create a local build of MetaMask using your preferred method.
  * You can find build instructions in the [readme](https://github.com/MetaMask/metamask-extension#readme).
* Open `Settings` > `Extensions`.
  * Or go straight to [chrome://extensions](chrome://extensions).
* Check "Developer mode".
* At the top, click `Load Unpacked Extension`.
  * If your find that your current version of Chrome has an unresponsive `Load Unpacked` button then consider using [Chrome Canary](https://www.google.com/chrome/canary/) instead.
* Navigate to your `metamask-extension/dist/chrome` folder.
* Click `Select`.
* Change to your locale via `chrome://settings/languages`
* Restart the browser and test the extension in your locale

Your dev build is now added to Chrome, and you can click `Inspect views
background.html` in its card on the extension settings page to view its dev console.
