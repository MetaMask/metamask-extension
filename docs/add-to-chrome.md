## Add Custom Build to Chrome

![Load dev build](./load-dev-build-chrome.gif)

* Open `Settings` > `Extensions`.
  * Or go straight to [chrome://extensions](chrome://extensions).
* Check "Developer mode".
* At the top, click `Load Unpacked Extension`.
* Navigate to your `metamask-extension/dist/chrome` folder.
* Click `Select`.
* Change to your locale via `chrome://settings/languages`
* Restart the browser and test the plugin in your locale

Your dev build is now added to Chrome, and you can click 'inspect views: background plugin' to view its dev console.
