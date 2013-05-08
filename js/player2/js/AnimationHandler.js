(function (Ayamel) {
    "use strict";
	
	var raf, caf, x, lastTime = 0,
		vendors = ['webkit', 'moz'];

	for(x = 0; x < vendors.length && !raf; ++x) {
		raf = window[vendors[x]+'RequestAnimationFrame'];
		caf = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!raf){
		raf = function(callback, element) {
			var currTime = +(new Date),
				timeToCall = Math.max(0, 16 - (currTime - lastTime)),
				id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
		caf = clearTimeout;
	}
	
    Ayamel.utils.Animation = {
        requestFrame: raf,
		cancelFrame: caf
    };
}(Ayamel));