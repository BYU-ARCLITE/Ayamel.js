/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 11:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {
    "use strict";

    var pseudoFullScreen = false;
    var exitFullScreen;
    var requestFullScreen;
    var fullScreenElement;
//    var isFullScreen;
    var eventFullScreen;

    // Setup the fullscreen functions
    if (!!document.mozCancelFullScreen) {
        exitFullScreen = function () {
            document.fullScreen && document.mozCancelFullScreen();
        };
        requestFullScreen = function (element) {
            element.mozRequestFullScreen();
        };
//        isFullScreen = function () {
//            return document.fullScreen;
//        };
        eventFullScreen = "mozfullscreenchange";
    } else if (!!document.webkitCancelFullScreen) {
        exitFullScreen = function () {
            document.webkitIsFullScreen && document.webkitCancelFullScreen();
        };
        requestFullScreen = function (element) {
            element.webkitRequestFullScreen();
        };
//        isFullScreen = function () {
//            return document.webkitIsFullScreen;
//        };
        eventFullScreen = "webkitfullscreenchange";
    } else {
        // Pseudo fullscreen
        exitFullScreen = function () {
            pseudoFullScreen = false;
            $(fullScreenElement).removeClass("pseudoFullScreen");
        };
        requestFullScreen = function (element) {
            pseudoFullScreen = true;
            fullScreenElement = element;
            $(element).addClass("pseudoFullScreen");
        };
//        isFullScreen = function () {
//            return pseudoFullScreen;
//        };

        pseudoFullScreen = false;
        eventFullScreen = "pseudofullscreenchange";
    }

    Ayamel.FullScreenHandler = {
        enter: function (element) {
            requestFullScreen(element);
        },
        exit: function () {
            exitFullScreen();
            fullScreenElement = null;
        },

        fullScreenEvent: eventFullScreen,

        getAvailableHeight: function() {
            if (eventFullScreen === "pseudofullscreenchange") {
                return $(window).height();
            } else {
                return screen.height;
            }
        }
    };
}(Ayamel));