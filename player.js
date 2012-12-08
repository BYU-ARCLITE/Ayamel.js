/*
Plan for Video Player:

Uniform interface for controls.
Constructor takes in some kind of resource description and a reference to the stage and internally selects the appropriate player:
	html5 video element
	youtube player
	flowplayer
	vimeo player
The player constructor deals with displaying the appropriate controls and so forth.
We should be able to instantiate multiple independent player objects in different stages.

Player:
	Reads playlists and sequences the display of different bits of media, including displaying playlist-level captions & annotations
Stage:
	Provides a DOM location for actors to appear
Actor:
	Prototype for anything that can appear on a stage
Video:
	Standalone on a stage or embeddable in a player; displays clip-level captions and annotations
Clip:
	Encapsulates different kinds of video and audio objects behind a uniform interface
*/
(function(Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	/*
	Full-screen option
	Volume Control (on-screen)
	Fast-forward and rewind buttons - hot keys for fast forward, rewind, (similar to FinalCut pro: ?, shift + ?, command + ?, command + ?)
	Be able to fast-forward and rewind at different speeds.
	Frame-accurate access to the video (access to the nearest 1/30 of a second.)
	Next and Previous buttons. Used for segmented videos to jump automatically to following or previous segments.
	A-B repeat: This would allow the user to set a start point and an end point, and the video would loop within the selected time frame.
	Time-code entry of start and stop points for A-B repeat.
	*/
	
	function Player(element,ar){
		if(!(this instanceof Player)){return new Player(element);}
		Ayamel.Renderer.call(this,element,ar);
		var self = this, time = 0, controls = this.controls;
		this.playlist = {actions:[],duration:0};
		this.events = {
			timeupdate: [
				function(){
					time = self.actor.currentTime + self.playlist.actions[self.index].startTime;
					if(time >= controls.loopEnd){
						self.currentTime = controls.loopStart;
					}
					else{controls.progress = time;}
					updateCaptions.call(self,time);
					console.log(time,self.actor.playing,self.actor.playbackRate,self.actor.volume);
				}
			],
			play: [function(){
				controls.playing = self.attrs.playing = true;
			}],
			pause: [function(){
				controls.playing = self.attrs.playing = false;
			}],
			ended: [this.Next.bind(this)]
		};
		Object.defineProperties(this,{
			currentTime: {
				get: function(){return time;},
				set: function(val){ //only takes care of external seeking
					time = +val;
					if(time > this.playlist.duration){time = this.playlist.duration;}
					else if(time < 0){time=0;}
					this.controls.progress = time;
					updateDisplay.call(this,time);
				},enumerable: true
			}
		});
		Object.seal(this);
	}
	
	function updateCaptions(time){
		var i, track, ctracks = this.playlist.ctracks;
		for(i=0;track = ctracks[i];i++){
			track.time = time;
		}
	}
	
	function updateDisplay(time){
		//when things other than sequential video clips are supported,
		//this function will have to deal with making sure all of the
		//right concurrent stuff is displayed at the same time
		var i, actor, action, offset,
			alist = this.playlist.actions;
		for(i=0;action = alist[i];i++){
			offset = time - action.startTime;
			if(offset >= 0 && time < action.endTime){
				actor = action.data;
				this.index = i;
				if(!actor.dynamic){ throw new Error("Static Actors Not Yet Supported."); }
				if(this.actor !== actor){ actor.Attach(this.frame, offset); }
				else{ this.actor.currentTime = offset;	}
				this.attrs.playing && actor.Play();
				break;
			}
		}
		updateCaptions.call(this,time);
	}
	
	function getDuration(act){
		var data = act.data;
		//switch here
		return data.endTime - data.startTime;
	}
	
	function processData(act){
		switch(act.type){
			case "displayVideo":
				return new Ayamel.Video(act.data);
			default:
				throw "Invalid Action Type";
		}
	}
	
	function processAction(act,seq){
		var duration = getDuration(act);
		return {
			type: act.type,
			data: processData(act),
			target: act.target,
			startTime: seq,
			endTime: duration+seq,
			duration: duration,
			nextIndex: act.nextIndex
		};
	}
	
	Player.prototype = Object.create(Ayamel.AyamelElement,{
		PlayList: {
			value: function(plObj, captionParser){
				var element = this.element,
					seq = 0,
					duration = 0,
					actlist;
				
				if(typeof plObj === 'string'){
					plObj = JSON.parse(plObj);
				}else if(typeof plObj !== 'object'){
					throw "Invalid Playlist";
				}
				
				actlist = plObj.actionList.map(function(act){
					var newact = processAction(act,seq);
					if(newact.duration < act.nextTime){throw "Blank space in the timeline.";}
					seq += act.nextTime;
					if(newact.endTime > duration){duration = newact.endTime;}
					return newact;
				});
				
				if(!plObj.hasOwnProperty('captionTracks')){
					plObj.captionTracks = [];
				}
				async.map(plObj.captionTracks,
					(typeof captionParser === 'function')
					?function(track,next){
						captionParser(track,function(err,ct){
							if(err){return next(err);}
							ct.target = element;
							next(null,ct);
						});
					}
					:function(track,next){next(null,track);},
					function(err,ctracks){
						if(err){throw err;}
						this.playlist = Object.freeze({
							actions: Object.freeze(actlist),
							ctracks: Object.freeze(ctracks),
							duration: duration
						});
						
						this.index = 0;
						this.attrs.playing = false;
						this.controls.duration = duration;
						this.currentTime = 0;
					}.bind(this)
				);
			},enumerable: true
		},
		Play: {
			value: function(){
				this.controls.playing = this.attrs.playing = true;
				if(this.index===-1){ this.currentTime = 0;}
				else if(!this.actor.dynamic){ this.Next(); }
				else{ this.actor.Play(); }
			},enumerable: true
		},
		Pause: {
			value: function() {
				this.controls.playing = this.attrs.playing = false;
				this.actor && this.actor.Pause();
			},enumerable: true
		},
		Next: {
			value: function(){
				var alist = this.playlist.actions,
					index = alist[this.index].nextIndex,
					actor;
				this.index = index;
				if(index > -1){
					actor = alist[index].data;
					if(actor !== this.actor){ actor.Attach(this.frame, 0); }
					if(actor.dynamic){
						this.attrs.playing && actor.Play();
						return;
					}
				}
				this.controls.playing = this.attrs.playing = false;
			},enumerable: true
		},
		bindKeys: {
			value: function(){
				var self=this,
					spacebinding = function(e){
						e.repeat || self[self.attrs.playing?'Pause':'Play']();
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
			get: function(){return this.playlist.duration;},
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
		DetachActor: {
			value: function(){
				var actor = this.actor;
				if(actor){ actor.Detach(); }
			}
		}
	});
	
	Ayamel.Player = Player;
}(Ayamel));