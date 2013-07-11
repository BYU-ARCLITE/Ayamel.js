/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 2:12 PM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel, global) {
    "use strict";

    var template =
        '<div class="progressBar">\
            <div class="progressLevel">\
                <div class="progressKnob"></div>\
            </div>\
        </div>';

    function ProgressBar(args) {
        var  _this = this,
            max = isNaN(+args.max)?1:(+args.max),
            min = +args.min||0,
            scale = 100/(max-min),
            value = Math.min(+args.progress||0,max),
            $element = $(template),
            element = $element[0],
            level = $element.find(".progressLevel")[0],
            left = 0, lastX = 0,
            moving = false;

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        level.style.width = (value-min)*scale+"%";

        function pxToValue(px){
            var pmax = parseInt(global.getComputedStyle(element,null).getPropertyValue('width'),10),
                pc = Math.min(Math.max(px,0),pmax)/pmax;
            return pc*(max-min)+min;
        }

        element.addEventListener(Ayamel.utils.mobile.isMobile ? "touchstart" : "mousedown", function (event) {
            if (moving) { return; }
            left = $element.offset().left + 10;
            moving = true;

            lastX = event.pageX;
            value = pxToValue(lastX - left);
            level.style.width = (value-min)*scale+"%";

            element.dispatchEvent(new CustomEvent('scrubstart',{bubbles:true,detail:{progress:value}}));
            element.dispatchEvent(new CustomEvent('levelchange', {bubbles:true,detail:{level:value}}));
            event.stopPropagation();
        }, false);

        document.body.addEventListener(Ayamel.utils.mobile.isMobile ? "touchmove" : "mousemove", function (event) {
            if (!moving) { return; }

            lastX = event.pageX;
            value = pxToValue(lastX - left);
            level.style.width = (value-min)*scale+"%";

            element.dispatchEvent(new CustomEvent('scrubupdate',{bubbles:true,detail:{progress:value}}));
            element.dispatchEvent(new CustomEvent('levelchange', {bubbles:true,detail:{level:value}}));
            event.stopPropagation();
        }, false);

        document.body.addEventListener(Ayamel.utils.mobile.isMobile ? "touchend" : "mouseup", function (event) {
            if (!moving) { return; }
            moving = false;

            value = pxToValue((Ayamel.utils.mobile.isMobile ? lastX : event.pageX) - left);
            level.style.width = (value-min)*scale+"%";
			
            element.dispatchEvent(new CustomEvent('scrubend',{bubbles:true,detail:{progress:value}}));
            event.stopPropagation();
        }, false);

        Object.defineProperties(this, {
            progress: {
                set: function(val){
                    if (moving) { return value; }
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

    ProgressBar.prototype.addEventListener = function(event, callback, capture) {
        this.element.addEventListener(event, callback, !!capture);
    };

    ProgressBar.prototype.removeEventListener = function(event, callback, capture) {
        this.element.removeEventListener(event, callback, !!capture);
    };

    Ayamel.classes.ProgressBar = ProgressBar;
}(Ayamel, window));