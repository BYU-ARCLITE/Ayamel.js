(function(Ayamel) {
    "use strict";

    var template =
        '<div class="rate">\
            <div class="speedIcon"></div>\
        </div>';

    function dispatchRate(element,rate) {
        var newEvent = document.createEvent("HTMLEvents");
        newEvent.initEvent("ratechange", true, true);
        newEvent.playbackRate = rate;
        element.dispatchEvent(newEvent);
    }

    function RateSlider(args) {
        var _this = this,
            rate = 1,
            $element = $(template),
            element = $element[0],
            slider = new Ayamel.controls.slider({
                $holder: $element,
                level: 100
            });

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        slider.addEventListener('levelchange',function(percent){
            rate = percent / 100;
            slider.level = percent;
            dispatchRate(element,rate);
        },false);

        // Allow resetting
        $element.children(".speedIcon").click(function () {
            rate = 1;
            slider.level = 100;
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
                    slider.level = rate*100;
                    return rate;
                }
            }
        });
    }

    Ayamel.controls.rate = RateSlider;
}(Ayamel));