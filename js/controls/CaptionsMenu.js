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
        '<div class="control button captions">\
            <div class="icon" title="Caption Menu"></div>\
            <div class="captionsMenu">\
                <div class="captionsMenuTipDark"></div>\
                <div class="captionsMenuTip"></div>\
                <div class="noCaptionTracks">No captions available.</div>\
            </div>\
        </div>';

    function CaptionsMenu(args) {
        var $element = $(template),
            element = $element[0],
            menu = $element.children(".captionsMenu")[0];

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);
        this.length = 0;

        // Set up clicking to show the menu
        element.addEventListener('click', function (event) {
            event.stopPropagation();
            element.classList.toggle("active");
        },false);
        document.addEventListener('click', function () {
            element.classList.remove("active");
        },false);
        menu.addEventListener('click', function (event) {
            event.stopPropagation();
        },false);
    }

    CaptionsMenu.prototype.addTrack = function(track) {
        // Create the menu entry
        var _this = this,
            $track = $('<div class="captionsMenuEntry">' + track.label + ' (' + track.language + ')</div>');
        this.$element.find(".noCaptionTracks").remove();
        this.$element.children(".captionsMenu").append($track);
        if (track.mode === "showing") { $track.addClass("active"); }
        this.length++;

        // Set up clicking here because we have the track in scope
        $track.click(function (e) {
            var active = this.classList.contains("active");
            e.stopPropagation();
            if(_this.length === 1){ _this.element.classList.remove("active"); }
            this.classList.toggle("active");
            track.mode = active?'disabled':'showing';
            _this.element.dispatchEvent(new CustomEvent(
                active?"disabletrack":"enabletrack",
                {bubbles:true,cancelable:true,detail:{track:track}}
            ));
        });
    };

    Ayamel.controls.captions = CaptionsMenu;
}(Ayamel));