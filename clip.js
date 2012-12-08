(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	var auto_pause = function(event){
			if(this.currentTime >= this.duration){
				this.Pause();
				this.fireEvent('ended');
			}
		};
			
	function Clip(res,start,stop){
		var i, cache, Cons = Ayamel.$cons;
		if(!start){start=0;}
		for(i = Cons.length-1;i>=0;i--){
			cache = Cons[i](res,start,stop);
			if(cache){
				Object.defineProperties(cache,{
					start: {value: start},
					stop: {get: function(){return stop||this.mediaDuration;}},
					duration: {get: function(){ return this.stop - this.start; }, enumerable: true},
					currentTime: {
						get: function(){ return this.mediaTime - this.start; },
						set: function(val){ return this.mediaTime = +val+this.start; },
						enumerable: true
					},
					auto_pause: {value: auto_pause.bind(cache)}
				});
				return cache;
			}
		}
		throw new Error("Could not play resource at " + res);
	}
	
	Clip.prototype = Object.create(Ayamel.AyamelElement,{
		addEventListener: {value: function(){}},
		removeEventListener: {value: function(){}},
		fireEvent: {value: function(evname){
			this.v.callHandlers(evname);
		}}
	});
	
	Ayamel.Clip = Clip;
}(Ayamel));