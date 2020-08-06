## Setting up the plugin

This method requires you to create a developer account on [iot.tuya.com](https://iot.tuya.com).

1. After you've created a new account, click "Cloud Development" in the top nav bar and click "Create".  After you've created a new application, click into it. 
2. The Access ID and Access Key are 2 of the 3 pieces of information required. The last one is the virtual ID that you can find in the Tuya app.
3. From the main screen of the Tuya app, click on Igenix Fan -> Edit (Top right) -> Device Information -> Virtual ID
4. Going back to Tuya Iot, go to App Service > App SDK.  Click on "Obtain SDK", select the WiFi option, and enter whatever you want for the package names and channel ID. Doesn't matter since this is only required for the next steps.
5. Go back to Cloud Development -> the application you created earlier, and select "Linked Device" on the left. Then click on the "Linked Devices added through app distribution" tab, and select "Add Apps".  Add the app you just created, and click "Ok".
6. Go to Cloud Development -> select your application -> Project Overview -> Linked Device -> Link devices by App Account.
7. Click 'Add App Account' and then on your Tuya Smart app, proceed to add a device, then you'll see a scan QR button at the top right, tap on that, and scan the QR code from Tuya IoT.