var h5PlayerInstall = function(host,global,callback){
	"use strict";
	
	var	h5Events = {
			abort:'error',// Data loading was aborted
			error:'error',// An error occured
			emptied:'error',// Data not present unexpectedly
			stalled:'error',// Data transfer stalled
			play:'play',// Video started playing (fired with play())
			pause:'pause',// Video has paused (fired with pause())
			playing:'play',// Playback started
			timeupdate:'timeupdate',// currentTime was changed
			seeked:'seek',
			ended:'ended',// Video has ended
			ratechange:'ratechange',// Playback rate has changed
			durationchange:'durationchange',// Duration has changed (for streams)
			volumechange:'volumechange'// Volume has changed
		},genVid = document.createElement('video');
		
	genVid.style.width = "100%";
	genVid.style.height = "100%";
	genVid.style.position = "absolute";
	
	function evt_dispatcher(event){	//translate h5 media event into Video event
		this.wrapper.callHandlers(h5Events[event.type]);
	};
	
	function h5Clip(src,start,stop){
		var cb, e, v_el = genVid.cloneNode(false),
			evt_cb = evt_dispatcher.bind(this);
		v_el.src = src+"#t="+start+","+stop;
		v_el.load();
		this.media = this.media_el = v_el;
		this.attrs = {currentTime:0};
		for(e in h5Events) if(h5Events.hasOwnProperty(e)){
			this.media.addEventListener(e,evt_cb,false);
		}
		cb = function(){
			this.media.currentTime = this.attrs.currentTime;
			this.media.removeEventListener('loadedmetadata',cb);
		}.bind(this);
		this.media.addEventListener('loadedmetadata',cb,false);
	}
	h5Clip.prototype = Object.create(host.VideoClipPrototype,{
		Play: {value: function() {
			var ct = this.media.currentTime;
			if(ct < this.stop){
				this.media.play();
			}
		}},
		Pause: {value: function(){this.media.pause();}},
		playing: {get: function(){return !(this.media.paused || this.media.ended);}},
		// The current playback time in seconds
		mediaTime: {
			set: function(time) {
				var m = this.media;
				return this[(this.media.readyState)?'media':'attrs'].currentTime = +time;
			},
			get: function() {
				return this[(this.media.readyState)?'media':'attrs'].currentTime;
			},
			enumerable: true
		},
		mediaDuration: {get: function() { return this.media.duration||0; }},
		muted: {
			set: function(mute) { return this.media.muted=!!mute; },
			get: function() {return this.media.muted;},
			enumerable: true
		}, volume: { //The volume as a percentage
			set: function(value) { return this.media.volume = value/100, value; },
			get: function() {return this.media.volume*100;},
			enumerable: true
		}, playbackRate: {
			set: function(value) { return this.media.playbackRate = +value; },
			get: function() { return this.media.playbackRate; },
			enumerable: true
		}, readyState: {
			get: function(){ return this.media.readyState; },
			enumerable: true
		}
	});
	
	callback(function(resource,start,stop){
		var i, j, src, check, file, files = resource.content.files;
		for(j = 0; check=['probably','maybe'][j]; j++){
			for(i = 0; file=files[i]; i++){
				if(genVid.canPlayType(files[i].mime)===check){
					src = files[i].download || files[i].stream;
					if(/^https?:\/\//.test(src)){
						return new h5Clip(src,start,stop);
					}
				}
			}
		}
		return null;
	});
};