/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template = '<div class="control button play paused"></div>';

    function PlayButton(args) {

        var playing = false,
			$element = $(template);

        this.$element = $element;
		this.element = $element[0];
        args.$holder.append($element);

        // Set up events
        this.$element.click(function (e) {
            e.stopPropagation();

            var event = document.createEvent("HTMLEvents");
            if (playing) {
                event.initEvent("pause", true, true);
                playing = false;
                $element.addClass("paused");
            } else {
                event.initEvent("play", true, true);
                playing = true;
                $element.removeClass("paused");
            }
            this.dispatchEvent(event);
        });

        // Be able to set the playing attribute
        Object.defineProperty(this, "playing", {
			enumerable: true,
            get: function () {
                return playing;
            },
            set: function (value) {
                playing = !!value;
                $element[playing?'removeClass':'addClass']("paused");
                return playing;
            }
        });
    }

    Ayamel.controls.play = PlayButton;
}(Ayamel));