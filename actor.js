	function Actor(){
		this.events = {};
		this.attrs = {playing:false};
		this.element = null;
		this.media = null;
	}
	Actor.prototype = Object.create(Ayamel.AyamelElement,{
		addEventListener: {
			value: function(event,cb){
				var cblist = this.events[event];
				if(cblist) {cblist.push(cb);}
				else {this.events[event] = [cb];}
				this.media && this.media.addEventListener(event,cb,false);
			}
		},
		removeEventListener: {
			value: function(event,cb){
				var index,
					cblist = this.events[event];
				if(cblist && (index = cblist.indexOf(cb))!==-1){
					if(cblist.length===1){delete this.events[event];}
					else{cblist.splice(index,1);}
				}
				this.media && this.media.removeEventListener(event,cb);
			}
		},
		callHandlers: {
			value: function(ename){
				var i,evt,handlers;
				if(!this.stage){return;}
				if(handlers = this.events[ename]){
					evt = document.createEvent("HTMLEvents");
					evt.initEvent(ename, true, true ); // event type,bubbling,cancelable
					for(i=handlers.length-1;i>=0;i--){
						handlers[i].call(this,evt);
					}
				}
			}
		},
		volume: { //The volume as a percentage
			set: function(val) {
				if(val > 100){val = 100;}
				else if(val < 0){val = 0;}
				return this.attrs.volume = (this.media)?(this.media.volume = val):val;
			},
			get: function() {return this.attrs.volume;},
			enumerable:true
		},
		muted: {
			set: function(mute) {
				return this.attrs.muted = (this.media)?(this.media.muted = mute):!!mute;
			},
			get: function() {return this.attrs.muted;},
			enumerable:true
		},
		readyState: {
			get: function(){ return this.media?this.media.readyState:0; },
			enumerable: true
		},
		Attach: {
			value: function(stage, time){
				this.stage = stage;
				this.events = stage.events;
				this.volume = stage.attrs.volume;
				this.muted = stage.attrs.muted;
				this.playbackRate = stage.attrs.playbackRate;
				this.currentTime = time||0;
				stage.DetachActor();
				stage.actor = this;
				stage.element.appendChild(this.element);
			}
		},
		Detach: {
			value: function(){
				this.media && this.media.Pause();
				this.stage.element.removeChild(this.element);
				this.stage.actor = null;
				this.stage = null;
			}
		}
	});

	function DynamicActor(){
		Actor.call(this);
		this.dynamic = true;
	}
	
	DynamicActor.prototype = Object.create(Actor.prototype,{
		Play: {
			value: function(){
				this.attrs.playing = true;
				this.media && this.media.Play();
			}
		},
		Pause: {
			value: function(){
				this.attrs.playing = false;
				this.media && this.media.Pause();
			}
		},
		playing: {get: function(){ return this.attrs.playing; } },
		currentTime: {	// The current playback time in seconds
			set: function(val){
				return (this.media || this.attrs).currentTime = +val;
			},				
			get: function(){
				return (this.media || this.attrs).currentTime;
			},
			enumerable:true
		},
		duration: {	//The duration in seconds
			get: function(){ return this.media?(this.media.duration||0):0; },
			enumerable:true
		},
		playbackRate: {	//The playback rate as a fraction
			set: function(rate){
				return this.attrs.playbackRate = (this.media)?(this.media.playbackRate = rate):+rate;
			},
			get: function(){ return this.attrs.playbackRate; },
			enumerable:true
		}
	});
	
	function StaticActor(){
		Actor.call(this);
		this.dynamic = false;
	}
	
	StaticActor.prototype = Object.create(Actor.prototype,{
		Play: { value: function() {} },
		Pause: { value: function() { this.media && this.media.Pause(); } },
		playing: { value:false, enumerable:true },
		currentTime: { value:0, enumerable:true },
		duration: { value:0, enumerable:true },
		playbackRate: { value:0, enumerable:true }
	});
	
	Ayamel.Actor = Actor;
	Ayamel.Actor.Dynamic = DynamicActor;
	Ayamel.Actor.Static = StaticActor;