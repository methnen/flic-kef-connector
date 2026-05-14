// flic-kef-connector — Flic Hub Studio module entry point.
// Maps a Flic Twist (registered as a "Speaker" virtual device for rotation,
// plus its built-in click gestures for transport) to a KEF gen-2 speaker.
//
// Configure the two constants below for your environment, then deploy.

var KEF_IP = "192.168.1.42";
var SPEAKER_VIRTUAL_DEVICE_ID = ""; // optional: leave "" to match any Speaker virtual device

// Message strings sent from the Flic app's "Send message to Hub Studio" action
// for each Twist click gesture. Edit these to match what you configure in the Flic app.
var MSG_PLAY_PAUSE = "play_pause";
var MSG_NEXT = "next";
var MSG_PREVIOUS = "previous";

var VOLUME_DEBOUNCE_MS = 100;
var STARTUP_RETRY_MS = 5000;
var DEBUG_LOG_FIRST_EVENTS = 3;

var KefClient = require("./kef");
var flicapp = require("flicapp");

var kef = new KefClient(KEF_IP);

// ---- Volume debounce ----------------------------------------------------

var pendingVolume = null;
var volumeTimer = null;

function scheduleVolume(target) {
    pendingVolume = target;
    if (volumeTimer !== null) return;
    volumeTimer = setTimeout(function () {
        var value = pendingVolume;
        pendingVolume = null;
        volumeTimer = null;
        kef.setVolume(value, function (error) {
            if (error) console.log("[kef] setVolume(" + value + ") failed: " + error);
        });
    }, VOLUME_DEBOUNCE_MS);
}

// ---- Event handlers -----------------------------------------------------

var rotationEventsLogged = 0;
var messageEventsLogged = 0;

flicapp.on("virtualDeviceUpdate", function (meta, values) {
    if (rotationEventsLogged < DEBUG_LOG_FIRST_EVENTS) {
        console.log("[twist] virtualDeviceUpdate meta=" + JSON.stringify(meta) +
                    " values=" + JSON.stringify(values));
        rotationEventsLogged++;
    }
    if (!meta || meta.dimmableType !== "Speaker") return;
    if (SPEAKER_VIRTUAL_DEVICE_ID && meta.virtualDeviceId !== SPEAKER_VIRTUAL_DEVICE_ID) return;
    if (!values || typeof values.volume !== "number") return;
    scheduleVolume(values.volume * 100);
});

flicapp.on("actionMessage", function (message) {
    if (messageEventsLogged < DEBUG_LOG_FIRST_EVENTS) {
        console.log("[twist] actionMessage message=" + JSON.stringify(message));
        messageEventsLogged++;
    }
    if (message === MSG_PLAY_PAUSE) {
        // KEF's protocol has no "play" control — "pause" is itself a toggle.
        kef.sendControl("pause", function (error) {
            if (error) console.log("[kef] sendControl(pause) failed: " + error);
        });
    } else if (message === MSG_NEXT) {
        kef.sendControl("next", function (error) {
            if (error) console.log("[kef] sendControl(next) failed: " + error);
        });
    } else if (message === MSG_PREVIOUS) {
        kef.sendControl("previous", function (error) {
            if (error) console.log("[kef] sendControl(previous) failed: " + error);
        });
    }
});

// ---- Startup probe ------------------------------------------------------

function probeSpeaker(attempt) {
    kef.getPlayerData(function (error, data) {
        if (error) {
            console.log("[kef] startup probe attempt " + attempt + " failed: " + error);
            if (attempt === 1) {
                setTimeout(function () { probeSpeaker(2); }, STARTUP_RETRY_MS);
            } else {
                console.log("[kef] giving up startup probe; module will keep running and retry on each event");
            }
            return;
        }
        kef.getVolume(function (volumeError, volume) {
            if (volumeError) {
                console.log("[kef] startup volume probe failed: " + volumeError);
                return;
            }
            console.log("[kef] connected to " + KEF_IP + " — volume=" + volume +
                        " state=" + (data && data.state));
        });
    });
}

console.log("[flic-kef-connector] starting against " + KEF_IP);
probeSpeaker(1);
