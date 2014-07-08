(function(Ayamel, global) {
    "use strict";

    var template =
        '<div class="sliderContainer">\
            <div class="sliderLevel">\
                <div class="sliderKnob"></div>\
            </div>\
        </div>';

    function SliderBar(args){
        var max = isNaN(+args.max)?1:(+args.max),
            min = +args.min||0,
            scale = 100/(max-min),
            value = Math.min(+args.level||0,max),
            element = Ayamel.utils.parseHTML(template),
            level = element.querySelector(".sliderLevel"),
            left = 0, lastX = 0,
            moving = false;

        this.element = element;
        args.holder.appendChild(element);

        level.style.width = (value-min)*scale+"%";

        function pxToValue(px){
            var pmax = parseInt(global.getComputedStyle(element,null).getPropertyValue('width'),10),
                pc = Math.min(Math.max(px,0),pmax)/pmax;
            return pc*(max-min)+min;
        }

        element.addEventListener(Ayamel.utils.mobile.isMobile ? "touchstart" : "mousedown", function(event){
            var val, newEvent;
            if (moving) { return; }
            moving = true;
            left = level.getBoundingClientRect().left + 7;
            lastX = event.clientX;
            val = pxToValue(lastX - left);
            element.dispatchEvent(new CustomEvent('scrubstart', {detail:{progress:val}}));
            element.dispatchEvent(new CustomEvent('levelchange', {detail:{level:val}}));
        },false);

        document.addEventListener(Ayamel.utils.mobile.isMobile ? "touchmove" : "mousemove", function(event){
            var val;
            if (!moving) { return; }
            lastX = event.clientX;
            val = pxToValue(lastX - left);
            element.dispatchEvent(new CustomEvent('scrubupdate', {detail:{progress:val}}));
            element.dispatchEvent(new CustomEvent('levelchange', {detail:{level:val}}));
        },false)
        document.addEventListener(Ayamel.utils.mobile.isMobile ? "touchend" : "mouseup", function(event){
            if (!moving) { return; }
            moving = false;
            element.dispatchEvent(new CustomEvent('scrubend', {detail:{progress:pxToValue((Ayamel.utils.mobile.isMobile ? lastX : event.clientX) - left)}}));
        },false);

        Object.defineProperties(this,{
            level: {
                set: function(val){
                    value = Math.max(Math.min(+val||0,max),min);
                    level.style.width = (value-min)*scale+"%";
                    return value;
                },
                get: function(){
                    return value;
                }
            },
            title: {
                set: function(val){ return element.title = val; },
                get: function(){ return element.title; }
            }
        });
    }

    SliderBar.prototype.dispatchEvent = function(evt){
        this.element.dispatchEvent(evt);
    };

    SliderBar.prototype.addEventListener = function(name, cb, capture){
        this.element.addEventListener(name, cb, capture);
    };

    SliderBar.prototype.removeEventListener = function(name, cb, capture){
        this.element.removeEventListener(name, cb, capture);
    };

    Ayamel.controls.slider = SliderBar;
}(Ayamel, window));