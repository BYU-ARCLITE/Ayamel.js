(function (Ayamel) {
    "use strict";

    //For some reason, the native functions just aren't working; callbacks never fire

    var raf,// = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame,
        caf,// = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame,
        lastTime = 0;

//    if (!raf){
        raf = function(callback) {
            var currTime = +(new Date),
                timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        caf = clearTimeout;
//    }

    Ayamel.utils.Animation = {
        requestFrame: raf,
        cancelFrame: caf
    };
}(Ayamel));