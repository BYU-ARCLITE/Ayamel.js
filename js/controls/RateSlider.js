(function(Ayamel) {
    "use strict";

    var template =
        '<div class="control rate">\
            <div class="button speed" title="speed reset"></div>\
        </div>';

    function RateSlider(args) {
        var _this = this,
            rate = 1,
            element = Ayamel.utils.parseHTML(template),
            slider = new Ayamel.controls.slider({
                holder: element,
                min: 0, max: 2,
                level: 1
            });

        this.element = element;
        args.holder.appendChild(element);

		slider.element.title = "playback speed";
        slider.addEventListener('levelchange',function(evt){
            rate = evt.detail.level;
            slider.level = rate;
            element.dispatchEvent(new CustomEvent("ratechange",{bubbles:true,cancelable:true,detail:{playbackRate:rate}}));
        },false);

        // Allow resetting
        element.querySelector(".speed").addEventListener('click',function(){
            rate = 1;
            slider.level = 1;
            element.dispatchEvent(new CustomEvent("ratechange",{bubbles:true,cancelable:true,detail:{playbackRate:rate}}));
        },false);

        // Be able to set the rate attribute
        Object.defineProperties(this, {
            rate: {
                enumerable: true,
                set: function (value) {
                    rate = +value||0;
                    slider.level = rate;
                    return rate;
                },
                get: function () {
                    return rate;
                }
            }
        });

        if(typeof args.parent === 'object'){
            Object.defineProperties(args.parent, {
                playbackRate: {
                    enumerable: true,
                    set: function (value) {
                        return _this.rate = value;
                    },
                    get: function () {
                        return rate;
                    }
                }
            });
        }
    }

    Ayamel.controls.rate = RateSlider;
}(Ayamel));