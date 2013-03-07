var flowPlayerInstall = function(host,global,callback){

	function flowReady(){
		var key,aq = this.aq;
		for(key in aq) if(aq.hasOwnProperty(key)){
			switch(key){
			}
		}
	}
	
	function flowEvtWatcher(){
		if(!(this.playing && this.events && this.events.timeupdate)){return;}
		var time = this.media.getTime();
		if(this._timelatch!==time){
			this._timelatch = time;
			this.v.callHandlers('timeupdate');
		}
		setTimeout(flowEvtWatcher.bind(this),50);
	}

	function evt_map(ename){
		this.v && this.v.callHandlers(ename);
	}
	
	function flowClip(res,start,stop){
		var f = host.genFrame.cloneNode(false),
			flashDiv = document.createElement('div');
		f.src = "about:blank";
		f.onload = function(){
			f.contentWindow.document.body.appendChild(flashDiv);
		};
		this.media_el = f;
		this.media = flowplayer(flashDiv,"flowplayer.swf",{
			clip:{
				url:		res,
				scaling:	'fit',
				start:		start,
				duration:	stop,
				onFinish:	evt_map.bind(this,'ended'),
				onStop:		evt_map.bind(this,'ended'),
				onPause:	evt_map.bind(this,'pause'),
				onStart:	evt_map.bind(this,'play'),
				onResume:	evt_map.bind(this,'play'),
				onSeek:		evt_map.bind(this,'seek')
			},
			onLoad:flowReady.bind(this),
			onVolume:evt_map.bind(this,'volumechange'),
			//onMute:,
			//onUnMute:,
			onError:evt_map.bind(this,'error'),
			plugins: {controls: null}
		});
		
		this.mediaClip = null;
		this.aq = {};
		this._timelatch = 0;
	}
	
	flowClip.prototype = Object.create(host.Clip.prototype,{
		ready: {get:function(){return this.media.isLoaded();}},
		addEventListener: {
			value: function(event,cb){
				var cblist = this.v.events[event];
				if(cblist) {cblist.push(cb);}
				else {
					this.v.events[event] = [cb];
					(event === 'timeupdate') && ytEvtWatcher.call(this);
				}
			}
		},
		Play: {
			value: function() {
				if(this.media.isLoaded()){
					if(this.media.getTime() < this.stop){
						if(this.media.getState() === 4){
							this.media.resume();
						}else{this.media.play();}
					}
				}else{this.aq.play = true;}
			}
		},
		Pause: {
			value: function() {
				if(this.media.isLoaded()){
					this.media.pause();
				}else{this.aq.play = false;}
			}
		},
		setCurrentTime: {		// The current playback time in seconds
			value: function(val) {
				val = Math.round(+val);
				if(this.media.isLoaded()){
					return this.media.seek(val);
				}else{
					return this.aq.time = val;
				}
			}
		},
		getCurrentTime: {
			value: function() { return this.media.isLoaded()?this.media.getTime():0; }
		},
		muted: {
			set: function(mute) {
				mute = !!mute;
				var op = mute?'mute':'unmute';
				if(this.ready){
					return this.media[op]();
				}else{
					this.aq.mute = op;
					return mute;
				}
			},
			get: function(){return this.media.isLoaded() && this.media.getStatus().muted;},
			enumerable: true
		},
		playing: {
			get: function(){return this.media.isPlaying();},
			enumerable: true
		},
		volume: { //The volume as a percentage
			set: function(val) {
				if(this.media.isLoaded()){
					return this.media.setVolume(val);
				}else{
					this.aq.volume = val;
					return val;
				}
			},
			get: function() { return this.media.isLoaded()?this.media.getVolume():100; },
			enumerable: true
		},
		duration: {
			get: function(){return this.media.isLoaded()?this.mediaClip.duration:0;},
			enumerable: true
		},
		Detach: {
			value: function(){
				var v = this.v;
				v.element.removeChild(this.media_el);
				v.removeEventListener('timeupdate',this.auto_pause,false);
				this.events = this.v = v.clip = null;
			}
		},
		Attach: {
			value: function(v){
				v.DetachClip();
				this.v = v;
				this.events = v.events;
				v.clip = this;
				this._timelatch = 0;
				v.addEventListener('timeupdate',this.auto_pause,false);
				v.element.appendChild(this.media_el);
			}
		}
	});
		
	var tag = document.createElement('script'),
		first = document.getElementsByTagName('script')[0];		
	tag.src = "flowplayer.js";
	tag.onload = function(){
		callback(function(res,start,stop){
			return new flowClip(res,start,stop);
		});		
	};
	first.parentNode.insertBefore(tag, first);	
};