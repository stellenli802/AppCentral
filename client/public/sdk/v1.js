(function(global) {
  "use strict";

  var _ready = false;
  var _pendingRequests = {};
  var _rateLimits = {};
  var _listeners = {};
  var _version = "1.0.0";

  var RATE_LIMIT_WINDOW = 30000;
  var RATE_LIMIT_MAX = {
    AUTH_CODE_REQUEST: 3,
    LOCATION_REQUEST: 5,
    NOTIFICATION_SEND: 10
  };

  function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function checkRateLimit(type) {
    var now = Date.now();
    var max = RATE_LIMIT_MAX[type] || 10;
    if (!_rateLimits[type]) {
      _rateLimits[type] = [];
    }
    _rateLimits[type] = _rateLimits[type].filter(function(t) {
      return now - t < RATE_LIMIT_WINDOW;
    });
    if (_rateLimits[type].length >= max) {
      return false;
    }
    _rateLimits[type].push(now);
    return true;
  }

  function sendToHost(data) {
    if (!global.parent || global.parent === global) {
      throw new Error("MiniApp SDK must run inside an iframe hosted by the platform.");
    }
    global.parent.postMessage(data, "*");
  }

  function waitForResponse(requestId, responseType, timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    return new Promise(function(resolve, reject) {
      var timer = setTimeout(function() {
        delete _pendingRequests[requestId];
        reject(new Error("Request timed out after " + timeoutMs + "ms"));
      }, timeoutMs);

      _pendingRequests[requestId] = {
        responseType: responseType,
        resolve: function(data) {
          clearTimeout(timer);
          resolve(data);
        },
        reject: function(err) {
          clearTimeout(timer);
          reject(err);
        }
      };
    });
  }

  global.addEventListener("message", function(event) {
    var msg = event.data;
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "HOST_ERROR") {
      var errorMsg = new Error(msg.message || "Host error: " + msg.code);
      var matched = false;
      var targetType = null;
      if (msg.requestType === "AUTH_CODE_REQUEST") targetType = "AUTH_CODE_RESPONSE";
      else if (msg.requestType === "LOCATION_REQUEST") targetType = "LOCATION_RESPONSE";

      if (targetType) {
        var keys = Object.keys(_pendingRequests);
        for (var i = 0; i < keys.length; i++) {
          var pending = _pendingRequests[keys[i]];
          if (pending && pending.responseType === targetType) {
            pending.reject(errorMsg);
            delete _pendingRequests[keys[i]];
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        var allKeys = Object.keys(_pendingRequests);
        for (var k = 0; k < allKeys.length; k++) {
          var p = _pendingRequests[allKeys[k]];
          if (p) {
            p.reject(errorMsg);
            delete _pendingRequests[allKeys[k]];
            break;
          }
        }
      }

      if (_listeners["error"]) {
        _listeners["error"].forEach(function(fn) { fn(msg); });
      }
      return;
    }

    if (msg.requestId && _pendingRequests[msg.requestId]) {
      var handler = _pendingRequests[msg.requestId];
      delete _pendingRequests[msg.requestId];

      if (msg.error) {
        handler.reject(new Error(msg.error));
      } else {
        handler.resolve(msg);
      }
      return;
    }

    if (msg.type === "NOTIFICATION_ACK") {
      var nKeys = Object.keys(_pendingRequests);
      for (var j = 0; j < nKeys.length; j++) {
        var nPending = _pendingRequests[nKeys[j]];
        if (nPending && nPending.responseType === "NOTIFICATION_ACK") {
          if (msg.success) {
            nPending.resolve(msg);
          } else {
            nPending.reject(new Error("Notification delivery failed"));
          }
          delete _pendingRequests[nKeys[j]];
          break;
        }
      }
    }

    if (_listeners[msg.type]) {
      _listeners[msg.type].forEach(function(fn) { fn(msg); });
    }
  });

  var MiniApp = {
    version: _version,

    init: function() {
      return new Promise(function(resolve) {
        if (_ready) {
          resolve();
          return;
        }
        sendToHost({ type: "READY" });
        _ready = true;
        resolve();
      });
    },

    requestAuthCode: function() {
      if (!checkRateLimit("AUTH_CODE_REQUEST")) {
        return Promise.reject(new Error("Rate limit exceeded. Max " + RATE_LIMIT_MAX.AUTH_CODE_REQUEST + " auth requests per " + (RATE_LIMIT_WINDOW / 1000) + "s."));
      }
      var requestId = generateId();
      sendToHost({
        type: "AUTH_CODE_REQUEST",
        requestId: requestId,
        origin: global.location.origin
      });
      return waitForResponse(requestId, "AUTH_CODE_RESPONSE").then(function(msg) {
        return msg.code;
      });
    },

    getLocation: function() {
      if (!checkRateLimit("LOCATION_REQUEST")) {
        return Promise.reject(new Error("Rate limit exceeded. Max " + RATE_LIMIT_MAX.LOCATION_REQUEST + " location requests per " + (RATE_LIMIT_WINDOW / 1000) + "s."));
      }
      var requestId = generateId();
      sendToHost({
        type: "LOCATION_REQUEST",
        requestId: requestId,
        origin: global.location.origin
      });
      return waitForResponse(requestId, "LOCATION_RESPONSE").then(function(msg) {
        return { latitude: msg.latitude, longitude: msg.longitude };
      });
    },

    sendNotification: function(options) {
      if (!options || !options.title || !options.body) {
        return Promise.reject(new Error("Notification requires title and body."));
      }
      if (!checkRateLimit("NOTIFICATION_SEND")) {
        return Promise.reject(new Error("Rate limit exceeded for notifications."));
      }
      var notifId = generateId();
      sendToHost({
        type: "NOTIFICATION_SEND",
        title: options.title,
        body: options.body,
        data: options.data || {}
      });
      return waitForResponse(notifId, "NOTIFICATION_ACK", 10000).then(function() {
        return true;
      });
    },

    openExternal: function(url) {
      if (!url || typeof url !== "string") {
        throw new Error("URL is required.");
      }
      global.open(url, "_blank", "noopener,noreferrer");
    },

    close: function() {
      sendToHost({ type: "CLOSE" });
    },

    on: function(eventType, callback) {
      if (!_listeners[eventType]) {
        _listeners[eventType] = [];
      }
      _listeners[eventType].push(callback);
      return MiniApp;
    },

    off: function(eventType, callback) {
      if (_listeners[eventType]) {
        _listeners[eventType] = _listeners[eventType].filter(function(fn) {
          return fn !== callback;
        });
      }
      return MiniApp;
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MiniApp;
  }
  global.MiniApp = MiniApp;

})(typeof window !== "undefined" ? window : this);
