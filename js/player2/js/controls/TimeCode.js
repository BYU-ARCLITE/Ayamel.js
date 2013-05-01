/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template = '<div class="timeCode">00:00 / 00:00</div>';

    function TimeCode(args) {
        var _this = this;
        var durationText = 0;
        var currentTimeText = 0;

        function generateTimeCode(time) {
            var newTime = Math.floor(time);

            // Figure out seconds
            var seconds = newTime % 60;

            // Figure out minutes
            newTime = ((newTime - seconds) / 60);
            var minutes = newTime % 60;

            // Figure out hours
            newTime = ((newTime - minutes) / 60);

            // Create the time code
            seconds = seconds < 10 ? "0" + seconds : seconds;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            newTime = newTime === 0 ? "" : newTime + ":";
            return newTime + minutes + ":" + seconds;
        }

        function updateText() {
            _this.$element.text(currentTimeText + " / " + durationText);
        }

        // Create the element
        this.$element = $(template);
        args.$holder.append(this.$element);

        // Be able to set the playing attribute
        Object.defineProperties(this, {
            currentTime: {
                set: function (value) {
                    currentTimeText = generateTimeCode(Number(value));
                    updateText();
                }
            },
            duration: {
                set: function (value) {
                    durationText = generateTimeCode(Number(value));
                    updateText();
                }
            }
        });
    }

    Ayamel.classes.TimeCode = TimeCode;
}(Ayamel));