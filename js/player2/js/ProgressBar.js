/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 2:12 PM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template =
        '<div class="progressBar">' +
            '<div class="progressLevelPad"></div>' +
            '<div class="progressLevel"></div>' +
            '<div class="progressKnob"></div>' +
            '<div class="progressLevelPad"></div>' +
        '</div>';

    function createElement() {
        var $element = $(template),
			element = $element[0],

        // Allow clicking
            moving = false,
            $level = $element.children(".progressLevel"),
            lastX;

        element.addEventListener(Ayamel.utils.mobile.isIPad ? "touchstart" : "mousedown", function (event) {
            $(this).addClass("moving");
            moving = true;
            var left = $(this).offset().left;
            var width = Math.min(Math.max(event.pageX - left - 10, 0), $(this).width());
            $level.width(width);

            var newEvent = document.createEvent("HTMLEvents");
            newEvent.initEvent("scrubstart", true, true);
            newEvent.progress = width / $(this).width();
            this.dispatchEvent(newEvent);
            event.stopPropagation();
        }, false);

        document.body.addEventListener(Ayamel.utils.mobile.isIPad ? "touchmove" : "mousemove", function (event) {
            if (moving) {
                var left = $element.offset().left;
                var elementWidth = $element.width();
                var width = Math.min(Math.max(event.pageX - left - 10, 0), elementWidth);
                lastX = event.pageX;
                $level.width(width);

                var newEvent = document.createEvent("HTMLEvents");
                newEvent.initEvent("scrubupdate", true, true);
                newEvent.progress = width / elementWidth;
                element.dispatchEvent(newEvent);
                event.stopPropagation();
            }
        }, false);
        document.body.addEventListener(Ayamel.utils.mobile.isIPad ? "touchend" : "mouseup", function (event) {
            if (moving) {
                $element.removeClass("moving");
                moving = false;
                var left = $element.offset().left;
                var elementWidth = $element.width();
                var width = Math.min(Math.max((Ayamel.utils.mobile.isIPad ? lastX : event.pageX) - left - 10, 0), elementWidth);
                $level.width(width);

                var newEvent = document.createEvent("HTMLEvents");
                newEvent.initEvent("scrubend", true, true);
                newEvent.progress = width / elementWidth;
                element.dispatchEvent(newEvent);
                event.stopPropagation();
            }
        }, false);

        return $element;
    }

    function ProgressBar(args) {
        var _this = this,
			progress = 0,
			$element = createElement(),
			element = $element[0];

        this.$element = $element;
		this.element = element;
        args.$holder.append($element);

        Object.defineProperty(this, "progress", {
            get: function () {
                return progress;
            },
            set: function (val) {
                var progress = +val||0;
                if (!$element.hasClass("moving")) {
                    $element.children(".progressLevel").width((progress * 100) + "%");
                }
            }
        });
    }

    ProgressBar.prototype.addEventListener = function(event, callback, capture) {
        this.element.addEventListener(event, callback, !!capture);
    };
	
    ProgressBar.prototype.removeEventListener = function(event, callback, capture) {
        this.element.removeEventListener(event, callback, !!capture);
    };

    Ayamel.classes.ProgressBar = ProgressBar;
}(Ayamel));