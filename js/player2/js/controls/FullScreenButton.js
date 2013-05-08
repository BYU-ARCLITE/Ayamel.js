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
        var fullScreen = false,
			$element = $(template),
			element = $element[0];

        this.$element = $element;
		this.element = element;
        args.$holder.append(this.$element);

        // Set up events
        this.$element.click(function (e) {
            var event = document.createEvent("HTMLEvents");
            event.initEvent(fullScreen?"exitfullscreen":"enterfullscreen", true, true);
			fullScreen = !fullScreen;
            this.classList.toggle("active");
            this.dispatchEvent(event);
            e.stopPropagation();
        });

        // Be able to set the playing attribute
        Object.defineProperty(this, "fullScreen", {
			enumerable: true,
            set: function (value) {
                fullScreen = !!value;
                element.classList[fullScreen?'add':'remove']("active");
				return fullScreen;
            },
			get: function () {
				return fullScreen;
			}
        });
    }

    Ayamel.controls.fullScreen = FullScreenButton;
}(Ayamel));