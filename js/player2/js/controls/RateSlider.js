(function(Ayamel) {
    "use strict";

    var template =
        '<div class="volume">\
            <div class="muteIcon"></div>\
            <div class="volumeSlider">\
                <div class="volumeLevelPad"></div>\
                <div class="volumeLevel"></div>\
                <div class="volumeKnob"></div>\
                <div class="volumeLevelPad"></div>\
            </div>\
        </div>';

    function dispatchRate(element,rate) {
        var newEvent = document.createEvent("HTMLEvents");
		newEvent.initEvent("ratechange", true, true);
		newEvent.playbackRate = rate;
		element.dispatchEvent(newEvent);
    }

    function RateSlider(args) {
        var _this = this,
			playing = false,
			$element = $(template),
			element = $element[0],
			$level = $element.find(".volumeLevel"),
			muted = false,
			moving = false,
			rate = 1,
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
				
				rate = width / 100;
				dispatchRate(element,rate);
            }
        });
        $("body")
            .mousemove(function (event) {
				var width;
                if (moving) {
                    width = Math.min(Math.max(event.pageX - levelPosition, 0), 100);
                    $level.width(width);

					rate = width / 100;
					dispatchRate(element,rate);
                }
            }).mouseup(function (event) {
                if (moving) {
                    moving = false;
                    event.stopPropagation();

					rate = $level.width() / 100;
					dispatchRate(element,rate);
                }
            });

        // Allow resetting
        $element.children(".muteIcon").click(function () {
			rate = 1;
			$level.width(100);
			dispatchRate(element,1);
        });
		
        // Be able to set the rate attribute
        Object.defineProperties(this, {
			rate: {
				enumerable: true,
				get: function () {
					return rate;
				},
				set: function (value) {
					rate = +value||0;
					$level.width(rate*100);
					return rate;
				}
			}
        });
    }

    Ayamel.controls.rate = RateSlider;
}(Ayamel));