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
        '<div class="control volume">\
            <div class="button mute" title="mute"></div>\
        </div>';

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

		slider.element.title = "volume";
        slider.addEventListener('levelchange',function(evt){
            volume = evt.detail.level;
            slider.level = volume;
            element.dispatchEvent(new CustomEvent("volumechange",{bubbles:true,cancelable:true,detail:{volume:volume}}));
        },false);

        // Allow muting
        $element.children(".mute").click(function () {
            var newEvent;
            if (muted) {
                muted = false;
				element.title="unmute";
                element.classList.remove("muted");
                newEvent = new Event("unmute",{bubbles:true});
            } else {
                muted = true;
				element.title="mute";
                element.classList.add("muted");
                newEvent = new Event("mute",{bubbles:true});
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

        if(typeof args.parent === 'object'){
            Object.defineProperties(args.parent, {
                muted: {
                    enumerable: true,
                    set: function (value) {
                        return _this.muted = value;
                    },
                    get: function () {
                        return muted;
                    }
                },
                volume: {
                    enumerable: true,
                    set: function (value) {
                        return _this.volume = value;
                    },
                    get: function () {
                        return volume;
                    }
                },
            });
        }
    }

    Ayamel.controls.volume = VolumeSlider;
}(Ayamel));