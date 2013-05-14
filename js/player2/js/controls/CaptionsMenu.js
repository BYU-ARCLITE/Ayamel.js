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
        '<div class="control button captions">' +
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
        var _this = this,
			$track = $('<div class="captionsMenuEntry">' + track.label + ' (' + track.language + ')</div>');
        this.$element.find(".noCaptionTracks").remove();
        this.$element.children(".captionsMenu").append($track);
        if (track.mode === "showing") {
            $track.addClass("active");
        }

        // Set up clicking here because we have the track in scope
        $track.click(function (e) {
			var event = document.createEvent("HTMLEvents"),
				active = this.classList.contains("active");
            this.classList.toggle("active");
            track.mode = active?'disabled':'showing';
            event.initEvent(active?"disabletrack":"enabletrack", true, true);
            event.track = track;
            _this.element.dispatchEvent(event);
            e.stopPropagation();
        });
    };

    Ayamel.controls.captions = CaptionsMenu;
}(Ayamel));