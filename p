diff --git a/app/scripts/metamask-controller.js b/app/scripts/metamask-controller.js
index 89905caaef..ddecaf42f5 100644
--- a/app/scripts/metamask-controller.js
+++ b/app/scripts/metamask-controller.js
@@ -500,8 +500,8 @@ export default class MetamaskController extends EventEmitter {

     const preferencesMessenger = this.controllerMessenger.getRestricted({
       name: 'PreferencesController',
-      allowedActions: ['PreferencesController:getState'],
-      allowedEvents: ['PreferencesController:stateChange'],
+      allowedActions: [],
+      allowedEvents: [],
     });

     this.preferencesController = new PreferencesController({