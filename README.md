# flic-kef-connector

A [Flic Hub Studio](https://hubsdk.flic.io/) module that lets a **Flic Twist** control a **KEF gen-2 wireless speaker** over the local network. The HTTP calls in `kef.js` mirror the protocol implementation of the MIT-licensed Python library [pykefcontrol](https://github.com/N0ciple/pykefcontrol).

## Supported speakers

- KEF LSX II LT *(tested)*
- KEF LSX II
- KEF LS50 Wireless II

These speakers all expose the same HTTP JSON API on port 80, so the module should work against any of them — but only the **KEF LSX II LT** has actually been verified so far. KEF LS60 Wireless uses the same API and should work too, but is likewise untested.

**Not supported:** the original gen-1 KEF LSX and LS50 Wireless. They use a binary TCP protocol on port 50001 and would need a different implementation.

## What the Twist does

- **Rotate** — adjust speaker volume.
- **Single click** — toggle play / pause.
- **Double click** — skip to next track.

## Prerequisites

- A Flic Hub LR on the same LAN as your KEF speaker.
- A Flic Twist paired to the Flic Hub.
- The Flic mobile app, signed in to the same Flic account as the hub.
- Flic Hub Studio: https://hubsdk.flic.io/
- The KEF speaker's IP address on your LAN (Ideally with a static IP Address assigned)

## Setup

1. **Find your speaker's IP Address** by opening the KEF Connect app, go to *Settings -> Speaker -> ⓘ*. If possible give your speakers a static IP Address through your router settings.
2. **Open the Flic app and navigate to the Flic Twist you want to use and set it up
    - Choose **Twist** then choose **Volume** then press on the three dots to the right of Flic Hub Studio
    - Choose **Speaker** and give it a name (e.g. KEF LSX LT) and press **ADD**
    - Choose your new Virtual Speaker from the list and then press **Add**
        - The app will then ask you for a max volume that's up to you
    - Choose *Push -> Flic Hub Studio*
        - Put `play_pause` into the Message field then press **Add**
    - Choose *Double Push -> Flic Hub Studio*
        - Put `next` into the Message field then press **Add**
3. **Go to Flic Hub Studio** and connect it to your Flic Hub LR
    - Click **+ Create Module** and give your module a name
        - Right click on the folder of your new module and choose **New File**
            - Name the new file `kef.js` and click **OK**
        - Copy/Paste the contents of the `kef.js` file here into the one in Flic Hub Studio
        - Copy/Paste the contents of the `main.js` file here into the one in Flic Hub Studio
            - Look for `var KEF_IP = "192.168.1.129";` and change `192.168.1.129` to the IP Address to the one for your speakers
            - Look for `var SPEAKER_VIRTUAL_DEVICE_ID = "KEF";` and change `KEF` to the name you gave your Virtual Speakers in the Flic app
        - Click the Play button next to the module name in the Flic Hub Studio side bar
            - **THIS IS VERY IMPORTANT! IF YOU DON'T DO IT THE MODULE WILL NOT BE RUNNING!**
4. **Try it!** Play something on your speakers and rotate the Flic Twist — the speaker volume should change

## Multiple Speakers/Flic Twists?

The volumne control targets the Virtual Speaker assigned to it however the Push and Double Push triggers are message specific. If you have more than one device you can set specific messages and update the `MSG_PLAY_PAUSE`, `MSG_NEXT`, and `MSG_PREVIOUS` values respectively so they're unique.

Leaving either empty means "accept any."

## Troubleshooting

- **Nothing happens when I rotate the Twist.** Confirm in the Flic Hub Studio log panel that you see `[twist] virtualDeviceUpdate` lines on rotation. If not, the Twist isn't paired as a Speaker virtual device — redo step 3 above. If you do see them but `meta.dimmableType` isn't `"Speaker"`, the virtual device is the wrong type.
- **Rotation logs appear but the speaker doesn't respond.** Confirm `KEF_IP` is reachable from the Hub: from another device on the same LAN, open `http://<KEF_IP>/api/getData?path=player:volume&roles=value` in a browser. You should get a JSON response. If not, the speaker is offline or on a different VLAN.
- **Volume changes feel laggy.** The module debounces volume writes by 100 ms while you're spinning. Final value lands within ~100 ms of you stopping. Increase or decrease `VOLUME_DEBOUNCE_MS` in `main.js` if you want different behavior.
- **Play/pause does the wrong thing.** A single click queries the current state from the speaker and sends the opposite — if the speaker's reported `state` field isn't what we expect, edit `kef.js` (`KefClient.prototype.isPlaying`) to match.

## Credits & references

- [`N0ciple/pykefcontrol`](https://github.com/N0ciple/pykefcontrol) (MIT licensed) — the Python library whose HTTP protocol implementation is mirrored by `kef.js`.
- [Flic Hub SDK documentation](https://hubsdk.flic.io/static/documentation/) — for the `http`, `buttons`, and `flicapp` modules used here.
