/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 11:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {
    "use strict";

    var pseudoFullScreen = false,
        exitFullScreen,
        requestFullScreen,
        fullScreenElement,
        isFullScreen,
        getAvailableHeight,
        getAvailableWidth,
        eventFullScreen;

    // Setup the fullscreen functions
    if (typeof document.mozCancelFullScreen === 'function') {
        exitFullScreen = function () {
            document.mozCancelFullScreen();
        };
        requestFullScreen = function (element) {
            element.mozRequestFullScreen();
        };
        isFullScreen = function () {
            return document.mozFullScreenElement !== null;
        };
        getAvailableHeight = function () {
            return screen.height;
        };
        getAvailableWidth = function () {
            return screen.width;
        };
        eventFullScreen = "mozfullscreenchange";
    } else if (typeof document.webkitCancelFullScreen === 'function') {
        exitFullScreen = function () {
            document.webkitCancelFullScreen();
        };
        requestFullScreen = function (element) {
            element.webkitRequestFullScreen();
        };
        isFullScreen = function () {
            return document.webkitFullscreenElement !== null;
        };
        getAvailableHeight = function () {
            return screen.height;
        };
        getAvailableWidth = function () {
            return screen.width;
        };
        eventFullScreen = "webkitfullscreenchange";
    } else {
        // Pseudo fullscreen
        exitFullScreen = function () {
            var element = fullScreenElement;
            pseudoFullScreen = false;
            fullScreenElement = null;
            element.classList.remove("pseudoFullScreen");
            element.dispatchEvent(new CustomEvent("pseudofullscreenchange",{bubbles:true,cancelable:true}));
        };
        requestFullScreen = function (element) {
            pseudoFullScreen = true;
            fullScreenElement = element;
            element.classList.add("pseudoFullScreen");
            element.dispatchEvent(new CustomEvent("pseudofullscreenchange",{bubbles:true,cancelable:true}));
        };
        isFullScreen = function () {
            return pseudoFullScreen;
        };
        getAvailableHeight = function () {
            return window.innerHeight;
        };
        getAvailableWidth = function () {
            return window.innerWidth;
        };
        eventFullScreen = "pseudofullscreenchange";
    }

    Ayamel.utils.FullScreen = Object.create({},{
        enter: { enumerable: true, value: requestFullScreen },
        exit:{ enumerable: true, value: exitFullScreen },
        fullScreenEvent: { enumerable: true, value: eventFullScreen },
        isFullScreen: { enumerable: true, get: isFullScreen },
        availableHeight: { enumerable: true, get: getAvailableHeight },
        availableWidth: { enumerable: true, get: getAvailableWidth }
    });
}(Ayamel));