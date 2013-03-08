(function (global) {
    "use strict";
    var fullScreen = true,
        requestFullScreen,
        exitFullScreen,
        eventFullScreen,
        isFullScreen,
        FullScreenElement,
        genFrame,
        pseduoFullScreen;

    // Setup the fullscreen functions
    if (!!document.mozCancelFullScreen) {
        exitFullScreen = function () {
            document.fullScreen && document.mozCancelFullScreen();
        };
        requestFullScreen = function (element) {
            element.mozRequestFullScreen();
            FullScreenElement = element;
        };
        isFullScreen = function () {
            return document.fullScreen;
        };
        eventFullScreen = "mozfullscreenchange";
    } else if (!!document.webkitCancelFullScreen) {
        exitFullScreen = function () {
            document.webkitIsFullScreen && document.webkitCancelFullScreen();
        };
        requestFullScreen = function (element) {
            element.webkitRequestFullScreen();
            FullScreenElement = element;
        };
        isFullScreen = function () {
            return document.webkitIsFullScreen;
        };
        eventFullScreen = "webkitfullscreenchange";
    } else {
        // Pseudo fullscreen
        exitFullScreen = function () {
            pseduoFullScreen = false;
            $(FullScreenElement).removeClass("pseudoFullScreen");
        };
        requestFullScreen = function (element) {
            pseduoFullScreen = true;
            FullScreenElement = element;
            $(element).addClass("pseudoFullScreen");
        };
        isFullScreen = function () {
            return pseduoFullScreen;
        };
        
        pseduoFullScreen = false;
    }

    // Create the Ayamel object, If not already defined
    if (!global.Ayamel) {
        genFrame = document.createElement('iframe');

        genFrame.style.width = "100%";
        genFrame.style.height = "100%";
        genFrame.style.position = "absolute";
        genFrame.frameBorder = "0";
        //	genFrame.sandbox = "allow-same-origin";
        genFrame.mozallowfullscreen = true;
        genFrame.seamless = true;

        // Set up hot-key handlers
        global.addEventListener('keydown', function (e) {
            var action = Ayamel.keybindings[e.key || e.keyCode];
            if (action) {
                if (typeof e.repeat === 'undefined') {
                    e.repeat = !!action.done;
                }
                action(e);
                action.done = true;
            }
        }, false);
        global.addEventListener('keyup', function (e) {
            var action = Ayamel.keybindings[e.key || e.keyCode];
            action && (action.done = false);
        }, false);

        // Create the actual object now
        global.Ayamel = {

            // The different parts. These remain uninitialized until defined
            TimedMedia: function () {
                throw "Ayamel.TimedMedia Uninitialized";
            },
            VideoPlayer: function () {
                throw "Ayamel.VideoPlayer Uninitialized";
            },
            Video: function () {
                throw "Ayamel.Video Uninitialized";
            },
            Text: function () {
                throw "Ayamel.Text Uninitialized";
            },
            get FSElement() {
                return isFullScreen() ? FullScreenElement : null;
            },
            AyamelElement: {
                get supportsFullscreen() {
                    return fullScreen;
                },
                get isFullScreen() {
                    return document.fullScreenElement === this.element || isFullScreen();
                },
                EnterFullScreen: function () {
                    fullScreen && requestFullScreen(this.element);
                },
                LeaveFullScreen: function () {
                    (FullScreenElement === this.element) && exitFullScreen();
                },
                addEventListener: function (event, callback) {
                    var cblist = this.events[event];
                    if (cblist) {
                        cblist.push(callback);
                    }
                    else {
                        this.events[event] = [callback];
                    }
                },
                removeEventListener: function (event, callback) {
                    var index,
                        cblist = this.events[event];
                    if (cblist && (index = cblist.indexOf(callback)) !== -1) {
                        if (cblist.length === 1) {
                            delete this.events[event];
                        }
                        else {
                            cblist.splice(index, 1);
                        }
                    }
                },
                callHandlers: function (ename) {
                    var evt, self = this;
                    if (this.events.hasOwnProperty(ename)) {
                        evt = document.createEvent("HTMLEvents");
                        evt.initEvent(ename, true, true); // event type,bubbling,cancelable
                        this.events[ename].forEach(function (handler) {
                            handler.call(self, evt);
                        });
                    }
                }
            },
            keybindings: {},
            genFrame: genFrame
        };
    }
}(window));