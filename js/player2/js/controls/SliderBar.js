(function(Ayamel) {
    "use strict";

    var template =
        '<div class="sliderContainer">\
            <div class="sliderLevel">\
                <div class="sliderKnob"></div>\
            </div>\
        </div>';

    function SliderBar(args){
        var _this = this,
            pc = Math.min(+args.level||0,100),
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

        level.style.width = pc+"%";

        element.addEventListener('mousedown',function (event) {
            var newEvent;
            if (!moving) {
                moving = true;
                levelPosition = $level.offset().left;
                _this.emit('levelchange', Math.min(Math.max(event.pageX - levelPosition, 0) - 7, 100));
            }
        },false);
        document.addEventListener('mousemove', function (event) {
            if (moving) {
                _this.emit('levelchange', Math.min(Math.max(event.pageX - levelPosition, 0) - 7, 100));
            }
        },false)
        document.addEventListener('mouseup', function (event) {
            moving = false;
        },false);

        Object.defineProperties(this,{
            level: {
                set: function(val){
                    pc = Math.min(+val||0,100);
                    level.style.width = pc+"%";
                    return pc;
                },
                get: function(){
                    return pc;
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
}(Ayamel));