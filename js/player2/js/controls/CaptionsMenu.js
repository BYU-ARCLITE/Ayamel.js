/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 9:18 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {
    "use strict";

    var template =
        '<div class="captions">' +
            '<div class="captionsIcon"></div>' +
            '<div class="captionsMenu">' +
                '<div class="captionsMenuTipDark"></div>' +
                '<div class="captionsMenuTip"></div>' +
                '<div class="noCaptionTracks">No captions available.</div>' +
            '</div>' +
        '</div>';

    function createElement() {
        var $element = $(template);

        // Set up clicking to show the menu
        $element.click(function (event) {
            event.stopPropagation();
            $(this).toggleClass("active");
        });
        $("body").click(function () {
            $element.removeClass("active");
        });
        $element.children(".captionsMenu").click(function (event) {
            event.stopPropagation();
        });

        return $element;
    }

    function CaptionsMenu(args) {
        this.$element = createElement();
        args.$holder.append(this.$element);
    }

    CaptionsMenu.prototype.addTrack = function(track) {
        // Create the menu entry
        var $track = $('<div class="captionsMenuEntry">' + track.label + ' (' + track.language + ')</div>');
        this.$element.find(".noCaptionTracks").remove();
        this.$element.children(".captionsMenu").append($track);
        if (track.mode === "showing") {
            $track.addClass("active");
        }

        // Set up clicking functionality
        $track.click(function () {
            $(this).toggleClass("active");

            // Send an event
            var event = document.createEvent("HTMLEvents");
            if ($(this).hasClass("active")) {
                event.initEvent("enabletrack", true, true);
            } else {
                event.initEvent("disabletrack", true, true);
            }
            event.track = track;
            this.dispatchEvent(event);
        });
    };


    Ayamel.classes.CaptionsMenu = CaptionsMenu
}(Ayamel));