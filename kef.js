// KEF gen-2 HTTP client (LSX II, LSX II LT, LS50 Wireless II).
// Mirrors the subset of pykefcontrol needed for volume + transport control.
// Protocol reference: https://github.com/N0ciple/pykefcontrol

var http = require("http");

function encodeQuery(params) {
    var parts = [];
    for (var key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
        }
    }
    return parts.join("&");
}

function KefClient(host) {
    this.host = host;
    this.base = "http://" + host;
}

KefClient.prototype._getData = function (path, roles, callback) {
    var url = this.base + "/api/getData?" + encodeQuery({ path: path, roles: roles });
    http.makeRequest({ url: url, method: "GET" }, function (error, result) {
        if (error) {
            callback(error, null);
            return;
        }
        if (result.statusCode < 200 || result.statusCode >= 300) {
            callback("HTTP " + result.statusCode + " " + result.statusMessage, null);
            return;
        }
        try {
            callback(null, JSON.parse(result.content));
        } catch (e) {
            callback("Failed to parse response: " + e.message, null);
        }
    });
};

KefClient.prototype._setData = function (path, roles, value, callback) {
    var url = this.base + "/api/setData";
    var body = JSON.stringify({ path: path, roles: roles, value: value });
    var options = {
        url: url,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        content: body,
    };
    http.makeRequest(options, function (error, result) {
        if (error) {
            callback(error);
            return;
        }
        if (result.statusCode < 200 || result.statusCode >= 300) {
            callback("HTTP " + result.statusCode + " " + result.statusMessage);
            return;
        }
        callback(null);
    });
};

KefClient.prototype.getVolume = function (callback) {
    this._getData("player:volume", "value", function (error, data) {
        if (error) {
            callback(error, null);
            return;
        }
        var value = Array.isArray(data) && data.length > 0 ? data[0] : data;
        if (value && typeof value.i32_ === "number") {
            callback(null, value.i32_);
        } else {
            callback("Unexpected volume payload: " + JSON.stringify(data), null);
        }
    });
};

KefClient.prototype.setVolume = function (volume, callback) {
    var clamped = Math.max(0, Math.min(100, Math.round(volume)));
    this._setData(
        "player:volume",
        "value",
        { type: "i32_", i32_: clamped },
        callback,
    );
};

KefClient.prototype.getPlayerData = function (callback) {
    this._getData("player:player/data", "value", function (error, data) {
        if (error) {
            callback(error, null);
            return;
        }
        var entry = Array.isArray(data) && data.length > 0 ? data[0] : data;
        callback(null, entry);
    });
};

// control: "pause" (toggles play/pause) | "next" | "previous"
KefClient.prototype.sendControl = function (control, callback) {
    this._setData(
        "player:player/control",
        "activate",
        { control: control },
        callback,
    );
};

module.exports = KefClient;
