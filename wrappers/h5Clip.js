var h5PlayerInstall = function(host,global,callback){

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
		this.v && this.v.callHandlers(h5Events[event.type]);
	};
	
	function h5Clip(res,start,stop){
		//do some checks to see if we can actually play this
		var e, v_el = genVid.cloneNode(false),
			evt_cb = evt_dispatcher.bind(this);
		v_el.src = res;
		this.media = this.media_el = v_el;
		this.events = null;
		for(e in h5Events) if(h5Events.hasOwnProperty(e)){
			this.media.addEventListener(e,evt_cb,false);
		}
	}
	h5Clip.prototype = Object.create(host.Clip.prototype,{
		Play: {value: function() {
			var ct = this.media.currentTime;
			if(ct < this.stop){
				this.media.play();
			}
		}},
		Pause: {value: function(){this.media.pause();}},
		playing: {get: function(){return !(this.media.paused || this.media.ended);}},
		// The current playback time in seconds
		setCurrentTime: {value: function(val) {
			return this.media.currentTime = val;
		}},
		getCurrentTime: {value: function() { return this.media.currentTime; }},
		muted: {
			set: function(mute) { return this.media.muted=!!mute; },
			get: function() {return this.media.muted;},
			enumerable: true
		}, volume: { //The volume as a percentage
			set: function(value) { return this.media.volume = value/100, value; },
			get: function() {return this.media.volume*100;},
			enumerable: true
		},
		Detach: {
			value: function(){
				var e, v = this.v;
				this.media.removeEventListener('timeupdate',this.auto_pause,false);
				this.events = this.v = v.clip = null;
				v.element.removeChild(this.media_el);	
			}
		},
		Attach: {
			value: function(v){
				var e,i,cb,handlers;
				v.DetachClip();
				if(this.media.readyState){
					this.media.currentTime = this.start;
				}else{
					cb = function(){
						this.media.currentTime = this.start;
						this.media.removeEventListener('loadedmetadata',cb,false);
					}.bind(this);
					this.media.addEventListener('loadedmetadata',cb,false);
				}
				
				this.v = v;
				this.events = v.events;
				v.clip = this;
				this.media.addEventListener('timeupdate',this.auto_pause,false);
				v.element.appendChild(this.media_el);
			}
		}
	});
	
	callback(function(res,start,stop){
		var //ext = /\.(.*)$/.exec(res)[1],
			playable = true;//genVid.canPlayType("video/"+ext)==='probably';
		//debugger;
		return playable?
			new h5Clip(res,start,stop):false;
	});
};