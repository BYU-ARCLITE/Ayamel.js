/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template =
        '<div class="volume">' +
            '<div class="muteIcon"></div>' +
            '<div class="volumeSlider">' +
                '<div class="volumeLevelPad"></div>' +
                '<div class="volumeLevel"></div>' +
                '<div class="volumeKnob"></div>' +
                '<div class="volumeLevelPad"></div>' +
            '</div>' +
        '</div>';

    function createElement() {
        var $element = $(template);
        var muted = false;

        // Allow knob sliding
        var $level = $element.find(".volumeLevel");
        var moving = false;
        var levelPosition;

        $element.children(".volumeSlider").mousedown(function (event) {
            if (!moving) {
                levelPosition = $level.offset().left;
                moving = true;

                var width = Math.min(Math.max(event.pageX - levelPosition, 0), 100);
                $level.width(width);

                var newEvent = document.createEvent("HTMLEvents");
                newEvent.initEvent("volumechange", true, true);
                newEvent.volume = width / 100;
                $element[0].dispatchEvent(newEvent);
            }
        });
        $("body")
            .mousemove(function (event) {
                if (moving) {
                    var width = Math.min(Math.max(event.pageX - levelPosition, 0), 100);
                    $level.width(width);

                    var newEvent = document.createEvent("HTMLEvents");
                    newEvent.initEvent("volumechange", true, true);
                    newEvent.volume = width / 100;
                    $element[0].dispatchEvent(newEvent);
                }
            }).mouseup(function (event) {
                if (moving) {
                    moving = false;
                    event.stopPropagation();

                    var newEvent = document.createEvent("HTMLEvents");
                    newEvent.initEvent("volumechange", true, true);
                    newEvent.volume = $level.width() / 100;
                    $element[0].dispatchEvent(newEvent);
                }
            });

        // Allow muting
        $element.children(".muteIcon").click(function () {
            var newEvent = document.createEvent("HTMLEvents");
            if (muted) {
                muted = false;
                $element.removeClass("muted");
                newEvent.initEvent("unmute", true, true);
            } else {
                muted = true;
                $element.addClass("muted");
                newEvent.initEvent("mute", true, true);
            }
            $element[0].dispatchEvent(newEvent);
        });

        return $element;
    }

    function VolumeSlider(args) {

        var playing = false;
        var _this = this;

        // Create the element
        this.$element = createElement();
        args.$holder.append(this.$element);


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

    Ayamel.classes.VolumeSlider = VolumeSlider;
}(Ayamel));