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
        var $element = $(template);

        // Allow clicking
        var moving = false;
        var $level = $element.children(".progressLevel");
        $element.mousedown(function (event) {
            $(this).addClass("moving");
            moving = true;
            var left = $(this).offset().left;
            var width = Math.min(Math.max(event.pageX - left - 10, 0), $(this).width());
            $level.width(width);

            var newEvent = document.createEvent("HTMLEvents");
            newEvent.initEvent("scrubstart", true, true);
            newEvent.progress = width / $(this).width();
            this.dispatchEvent(newEvent);
        });
        $("body")
            .mousemove(function (event) {
                if (moving) {
                    var left = $element.offset().left;
                    var elementWidth = $element.width();
                    var width = Math.min(Math.max(event.pageX - left - 10, 0), elementWidth);
                    $level.width(width);

                    var newEvent = document.createEvent("HTMLEvents");
                    newEvent.initEvent("scrubupdate", true, true);
                    newEvent.progress = width / elementWidth;
                    $element[0].dispatchEvent(newEvent);
                }
            }).mouseup(function (event) {
                if (moving) {
                    $element.removeClass("moving");
                    moving = false;
                    var left = $element.offset().left;
                    var elementWidth = $element.width();
                    var width = Math.min(Math.max(event.pageX - left - 10, 0), elementWidth);
                    $level.width(width);

                    var newEvent = document.createEvent("HTMLEvents");
                    newEvent.initEvent("scrubend", true, true);
                    newEvent.progress = width / elementWidth;
                    $element[0].dispatchEvent(newEvent);
                }
            });

        return $element;
    }

    function ProgressBar(args) {
        var _this = this;
        var progress = 0;

        this.$element = createElement();
        args.$holder.append(this.$element);

        Object.defineProperty(this, "progress", {
            get: function () {
                return progress;
            },
            set: function (val) {
                var progress = Number(val);

                if (!_this.$element.hasClass("moving")) {
                    _this.$element.children(".progressLevel").width((progress * 100) + "%");
                }
            }
        });
    }

    ProgressBar.prototype.addEventListener = function(event, callback) {
        this.$element[0].addEventListener(event, callback);
    };

    Ayamel.classes.ProgressBar = ProgressBar;
}(Ayamel));