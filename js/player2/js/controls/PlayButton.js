/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template = '<div class="playButton paused"></div>';

    function createElement() {
        return $(template);
    }

    function PlayButton(args) {

        var playing = false;
        var _this = this;

        this.$element = createElement();
        args.$holder.append(this.$element);

        // Set up events
        this.$element.click(function (e) {
            e.stopPropagation();

            var event = document.createEvent("HTMLEvents");
            if (playing) {
                event.initEvent("pause", true, true);
                playing = false;
                _this.$element.addClass("paused");
            } else {
                event.initEvent("play", true, true);
                playing = true;
                _this.$element.removeClass("paused");
            }
            this.dispatchEvent(event);
        });

        // Be able to set the playing attribute
        Object.defineProperty(this, "playing", {
            get: function () {
                return playing;
            },
            set: function (value) {
                playing = !!value;
                if (playing) {
                    _this.$element.removeClass("paused");
                } else {
                    _this.$element.addClass("paused");
                }
            }
        });
    }

    Ayamel.classes.PlayButton = PlayButton;
}(Ayamel));