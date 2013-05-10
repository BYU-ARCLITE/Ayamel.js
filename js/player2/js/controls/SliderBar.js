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
            levelPosition = 0,
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

        element.addEventListener('mousedown',function (event) {
            var newEvent;
            if (!moving) {
                moving = true;
                levelPosition = $level.offset().left + 7;
                _this.emit('levelchange', pxToValue(event.pageX - levelPosition));
            }
        },false);
        document.addEventListener('mousemove', function (event) {
            if (moving) {
                _this.emit('levelchange', pxToValue(event.pageX - levelPosition));
            }
        },false)
        document.addEventListener('mouseup', function (event) {
            moving = false;
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

    SliderBar.prototype.emit = function(evt, data){
        var that = this, fns = this.events[evt];
        fns && fns.forEach(function(cb){ try{cb.call(that,data);}catch(e){} });
    };

    SliderBar.prototype.addEventListener = function(name, cb, capture){
        if(this.events.hasOwnProperty(name)){ this.events[name].push(cb); }
        else{ this.events[name] = [cb]; }
    };

    SliderBar.prototype.removeEventListener = function(name, cb, capture){
        var idx, fns = this.events[evt];
        if(!(fns instanceof Array)){ return; }
        idx = fns.indexOf(cb);
        if(idx === -1){ return; }
        fns.splice(idx,1);
    };

    Ayamel.controls.slider = SliderBar;
}(Ayamel, window));