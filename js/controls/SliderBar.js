(function(Ayamel, global) {
    "use strict";

    var template =
        '<div class="sliderContainer">\
            <div class="sliderLevel">\
                <div class="sliderKnob"></div>\
            </div>\
        </div>';

    function SliderBar(args){
        var _this = this,
            max = isNaN(+args.max)?1:(+args.max),
            min = +args.min||0,
            scale = 100/(max-min),
            value = Math.min(+args.level||0,max),
            $element = $(template),
            element = $element[0],
            $level = $element.find(".sliderLevel"),
            level = $level[0],
            left = 0, lastX = 0,
            moving = false;

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        this.events = {};

        level.style.width = (value-min)*scale+"%";

        function pxToValue(px){
            var pmax = parseInt(global.getComputedStyle(element,null).getPropertyValue('width'),10),
                pc = Math.min(Math.max(px,0),pmax)/pmax;
            return pc*(max-min)+min;
        }

        element.addEventListener(Ayamel.utils.mobile.isMobile ? "touchstart" : "mousedown", function (event) {
            var val, newEvent;
            if (moving) { return; }
            moving = true;
            left = $level.offset().left + 7;
            lastX = event.pageX;
            val = pxToValue(lastX - left);
            _this.dispatchEvent(new CustomEvent('scrubstart', {detail:{progress:val}}));
            _this.dispatchEvent(new CustomEvent('levelchange', {detail:{level:val}}));
        },false);
        document.addEventListener(Ayamel.utils.mobile.isMobile ? "touchmove" : "mousemove", function (event) {
			var val;
            if (!moving) { return; }
            lastX = event.pageX;
			val = pxToValue(lastX - left);
            _this.dispatchEvent(new CustomEvent('scrubupdate', {detail:{progress:val}}));
            _this.dispatchEvent(new CustomEvent('levelchange', {detail:{level:val}}));
        },false)
        document.addEventListener(Ayamel.utils.mobile.isMobile ? "touchend" : "mouseup", function (event) {
            if (!moving) { return; }
            moving = false;
            _this.dispatchEvent(new CustomEvent('scrubend', {detail:{progress:pxToValue((Ayamel.utils.mobile.isMobile ? lastX : event.pageX) - left)}}));
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
            }
        });
    }

    SliderBar.prototype.dispatchEvent = function(evt){
        var that = this, fns = this.events[evt.type];
		evt.target = this;
        fns && fns.forEach(function(cb){ try{cb.call(that,evt);}catch(ignore){} });
    };

    SliderBar.prototype.addEventListener = function(name, cb, capture){
        if(this.events.hasOwnProperty(name)){ this.events[name].push(cb); }
        else{ this.events[name] = [cb]; }
    };

    SliderBar.prototype.removeEventListener = function(name, cb, capture){
        var idx, fns = this.events[evt];
        if(!(fns instanceof Array)){ return; }
        idx = fns.indexOf(cb);
        if(~idx){ fns.splice(idx,1); }
    };

    Ayamel.controls.slider = SliderBar;
}(Ayamel, window));