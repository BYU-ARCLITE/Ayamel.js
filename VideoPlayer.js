(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	function VideoPlayer(element,ar){
		if(!(this instanceof VideoPlayer)){return new VideoPlayer(element,ar);}
		Ayamel.UniformAspectRatio.call(this,element,ar);
		Ayamel.MediaController.call(this,this.aspectElement);
		var self = this, time = 0, controls = this.controls;
		
		this.index = -1;
		this.actor = null;
		
		this.events = {
			timeupdate: [
				function(){
					time = self.actor.currentTime;
					if(time >= controls.loopEnd){self.currentTime = controls.loopStart;}
					else{controls.progress = time;}
					console.log(time);
				}
			],
			play: [function(){
				controls.playing = self.attrs.playing = true;
			}],
			pause: [function(){
				controls.playing = self.attrs.playing = false;
			}],
			ended: [function(){
				controls.playing = self.attrs.playing = false;
				self.currentTime = 0;
			}]
		};
		Object.defineProperty(this,'currentTime',{
			get: function(){return time;},
			set: function(val){ //only takes care of external seeking
				time = +val;
				if(time > this.duration){time = this.duration;}
				else if(time < 0){time=0;}
				this.controls.progress = time;
				if(this.actor){ this.actor.currentTime = time; }
			},enumerable: true
		});
		Object.seal(this);
	}
	
	VideoPlayer.prototype = Object.create(Ayamel.AyamelElement,{
		Play: {
			value: function(){
				if(this.actor && this.actor.dynamic){
					this.controls.playing = this.attrs.playing = true;
					this.actor.Play();
				}
			}
		},
		Pause: {
			value: function() {
				if(this.actor && this.actor.dynamic){
					this.controls.playing = this.attrs.playing = false;
					this.actor.Pause();
				}
			}
		},
		bindKeys: {
			value: function(){
				var self=this,
					spacebinding = function(e){
						e.repeat || self[self.attrs.playing?'Pause':'Play']();
						e.preventDefault();
					},
					upbinding = function(e){
						if(e.ctrlKey && !e.repeat){self.muted = false;}
						else{self.volume+=1;}
					},
					dnbinding = function(e){
						if(e.ctrlKey){e.repeat || (self.muted = true);}
						else{self.volume-=1;}
					},
					leftbinding = function(e){
						if(e.ctrlKey){self.controls.loopStart-=.25;}
						else if(e.shiftKey){self.controls.loopEnd-=.25;}
						else{self.playbackRate-=.1;}
					},
					rightbinding = function(e){
						if(e.ctrlKey){self.controls.loopStart+=.25;}
						else if(e.shiftKey){self.controls.loopEnd+=.25;}
						else{self.playbackRate+=.1;}
					},
					delbinding = function(e){
						e.repeat || (self.controls.loopPoint = null);
					},
					screenbinding = function(e){
						if(e.ctrlKey && !e.repeat){
							self.EnterFullScreen();
						}
					};
				
				Ayamel.keybindings = {
					13: screenbinding,
					32:	spacebinding,
					37:	leftbinding,
					38:	upbinding,
					39:	rightbinding,
					40:	dnbinding,
					46: delbinding,
					' ':			spacebinding,
					DOM_VK_RETURN:	screenbinding,
					DOM_VK_LEFT:	leftbinding,
					DOM_VK_UP:		upbinding,
					DOM_VK_RIGHT:	rightbinding,
					DOM_VK_DOWN:	dnbinding,
					DOM_VK_DELETE:	delbinding
				};
			}
		},
		duration: {
			get: function(){return this.actor.duration;},
			enumerable: true
		},
		muted: {
			get: function() {return this.attrs.muted;},
			set: function(mute) {
				this.controls.muted = this.attrs.muted = mute;
				this.actor && (this.actor.muted = mute);
				return mute;
			},enumerable: true
		},
		volume: {
			get: function(){return this.attrs.volume;},
			set: function(val) { //The volume as a percentage
				this.attrs.volume = this.controls.volume = val;
				this.actor && (this.actor.volume = this.attrs.volume);
				return val;
			},enumerable: true
		},
		playbackRate: {
			get: function(){return this.attrs.playbackRate;},
			set: function(val) {
				val = +val || 0;
				this.attrs.playbackRate = this.controls.playbackRate = val;
				this.actor && (this.actor.playbackRate = this.attrs.playbackRate);
				return val;
			},enumerable: true
		},
		AttachActor: {
			value: function(video){
				var cb;
				video.Attach(this);
				if(video.readyState){
					this.controls.duration = video.duration;
				}else{
					cb = function(){
						this.controls.duration = video.duration;
						video.removeEventListener('durationchange',cb,false);
					}.bind(this);
					video.addEventListener('durationchange',cb,false);
				}
			}
		},
		DetachActor: {
			value: function(){
				var video = this.actor;
				if(video){
					video.dynamic && video.Pause();
					video.Detach();
				}
			}
		}
	});
	
	Ayamel.VideoPlayer = VideoPlayer;
}(Ayamel));