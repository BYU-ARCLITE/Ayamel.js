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

    function CaptionsMenu(args) {
		var $element = $(template),
			element = $element[0],
			$menu = $element.children(".captionsMenu");

        this.$element = $element;
		this.element = element;
        args.$holder.append($element);
			
        // Set up clicking to show the menu
        $element.click(function (event) {
            event.stopPropagation();
            $(this).toggleClass("active");
        });
        $("body").click(function () {
            $element.removeClass("active");
        });
        $menu.click(function (event) {
            event.stopPropagation();
        });
    }

    CaptionsMenu.prototype.addTrack = function(track) {
        // Create the menu entry
        var _this = this;
        var $track = $('<div class="captionsMenuEntry">' + track.label + ' (' + track.language + ')</div>');
        this.$element.find(".noCaptionTracks").remove();
        this.$element.children(".captionsMenu").append($track);
        if (track.mode === "showing") {
            $track.addClass("active");
        }

        // Set up clicking here because we have the track in scope
        $track.click(function (e) {

            // Send an event
            var event = document.createEvent("HTMLEvents");
            event.initEvent(this.classList.contains("active")?"enabletrack":"disabletrack", true, true);
            event.track = track;
            this.classList.toggle("active");
            _this.element.dispatchEvent(event);
            e.stopPropagation();
        });
    };

    Ayamel.classes.CaptionsMenu = CaptionsMenu
}(Ayamel));