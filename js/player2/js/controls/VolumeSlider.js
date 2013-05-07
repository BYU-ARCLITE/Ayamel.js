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

    function dispatchVolume(element,volume) {
        var newEvent = document.createEvent("HTMLEvents");
		newEvent.initEvent("volumechange", true, true);
		newEvent.volume = volume;
		element.dispatchEvent(newEvent);
    }

    function VolumeSlider(args) {
        var _this = this,
			playing = false,
			$element = $(template),
			element = $element[0],
			$level = $element.find(".volumeLevel"),
			muted = false,
			moving = false,
			volume = 1,
			levelPosition;
			
        this.$element = $element;
		this.element = element;
        args.$holder.append($element);
			
        $element.children(".volumeSlider").mousedown(function (event) {
			var width, newEvent;
            if (!moving) {
                levelPosition = $level.offset().left;
                moving = true;

                width = Math.min(Math.max(event.pageX - levelPosition, 0), 100);
                $level.width(width);
				
				volume = width / 100;
				dispatchVolume(element,volume);
            }
        });
        $("body")
            .mousemove(function (event) {
				var width;
                if (moving) {
                    width = Math.min(Math.max(event.pageX - levelPosition, 0), 100);
                    $level.width(width);

					volume = width / 100;
					dispatchVolume(element,volume);
                }
            }).mouseup(function (event) {
                if (moving) {
                    moving = false;
                    event.stopPropagation();

					volume = $level.width() / 100;
					dispatchVolume(element,volume);
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
            element.dispatchEvent(newEvent);
        });
		
        // Be able to set the muted & volume attributes
        Object.defineProperties(this, {
			muted: {
				enumerable: true,
				get: function () {
					return muted;
				},
				set: function (value) {
					muted = !!value;
					$element[muted?'addClass':'removeClass']("muted");
					return muted;
				}
			},
			volume: {
				enumerable: true,
				get: function () {
					return volume;
				},
				set: function (value) {
					volume = +value;
					$level.width(volume*100);
					return volume;
				}
			}
        });
    }

    Ayamel.classes.VolumeSlider = VolumeSlider;
}(Ayamel));