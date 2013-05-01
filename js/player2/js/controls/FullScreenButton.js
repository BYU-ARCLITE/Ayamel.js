/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template = '<div class="fullScreenButton"></div>';

    function FullScreenButton(args) {
        var _this = this;

        this.$element = $(template);
        args.$holder.append(this.$element);

        // Set up events
        this.$element.click(function (e) {
            e.stopPropagation();

            $(this).toggleClass("active");

            var event = document.createEvent("HTMLEvents");
            if ($(this).hasClass("active")) {
                event.initEvent("enterfullscreen", true, true);
            } else {
                event.initEvent("exitfullscreen", true, true);
            }
            this.dispatchEvent(event);
        });

        // Be able to set the playing attribute
        Object.defineProperty(this, "fullScreen", {
            set: function (value) {
                var fullScreen = !!value;
                if (fullScreen) {
                    this.$element.addClass("active");
                } else {
                    this.$element.removeClass("active");
                }
            }
        });
    }

    Ayamel.classes.FullScreenButton = FullScreenButton;
}(Ayamel));