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
        '<div class="volume">\
            <div class="muteIcon"></div>\
        </div>';

    function dispatchVolume(element,volume) {
        var newEvent = document.createEvent("HTMLEvents");
        newEvent.initEvent("volumechange", true, true);
        newEvent.volume = volume;
        element.dispatchEvent(newEvent);
    }

    function VolumeSlider(args) {
        var _this = this,
            volume = 1,
            muted = false,
            $element = $(template),
            element = $element[0],
            slider = new Ayamel.controls.slider({
                $holder: $element,
                level: 1
            });

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        slider.addEventListener('levelchange',function(level){
            volume = level;
            slider.level = level;
            dispatchVolume(element,volume);
        },false);

        // Allow muting
        $element.children(".muteIcon").click(function () {
            var newEvent = document.createEvent("HTMLEvents");
            if (muted) {
                muted = false;
                element.classList.remove("muted");
                newEvent.initEvent("unmute", true, true);
            } else {
                muted = true;
                element.classList.add("muted");
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
                    element.classList[muted?'add':'remove']("muted");
                    return muted;
                }
            },
            volume: {
                enumerable: true,
                get: function () {
                    return volume;
                },
                set: function (value) {
                    volume = +value||0;
                    slider.level = volume;
                    return volume;
                }
            }
        });
    }

    Ayamel.controls.volume = VolumeSlider;
}(Ayamel));