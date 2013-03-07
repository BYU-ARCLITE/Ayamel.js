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

Stage -> Video (with events and stuff) -> Clip (different kinds of videos that can be loaded)

*/

(function(global){
	var fs = false, //mozRequestFullScreen
		dur_descriptor = {get: function(){ return this.stop-this.start; }, enumerable: true},
		time_descriptor = {	get: function(){ return this.getCurrentTime() - this.start; },
							set: function(val){ return this.setCurrentTime(Math.round(+val+this.start)); },
							enumerable: true},
		auto_pause = function(event){
			if(this.currentTime >= this.duration){
				this.Pause();
				this.v.callHandlers('ended');
			}
		},
		VCons = [];
	
	function Clip(res,start,stop){
		var i, cache;
		if(!start){start=0;}
		for(i = VCons.length-1;i>=0;i--){
			cache = VCons[i](res,start,stop);
			if(cache){
				Object.defineProperties(cache,{
					start: {value: start},
					stop: {get: function(){ return (typeof stop !== 'undefined')?stop:this.duration; }},
					duration: dur_descriptor,
					currentTime: time_descriptor,
					auto_pause: {value: auto_pause.bind(cache)}
				});
				return cache;	
			}
		}
		throw new Error("Could not play video at " + res);
	}
	
	Object.defineProperties(Clip.prototype,{
		addEventListener: {value: function(){}},
		removeEventListener: {value: function(){}},
		fireEvent: {value: function(evname){
			this.v.callHandlers(evname);
		}},
		supportsControls: {get: function(){return true;}},
		supportsFullscreen: {get: function(){return fs;}},
		supportsResizescreen: {get: function() {return true;}},
		EnterFullscreen: {
			value: function() {return fs && this.media_el.mozRequestFullScreen();}
		},
		LeaveFullscreen: {
			value: function() {return !fs || this.media_el.mozCancelFullScreen();}
		}
	});


	function Video(){
		if(!(this instanceof Video)){return new Video;}
		this.element = document.createElement('div');
		this.events = {};
		this.clip = null;
		this.attrs = {};
	}
	Video.prototype = {
		addEventListener:function(event,cb){
			var cblist = this.events[event];
			if(cblist) {cblist.push(cb);}
			else {this.events[event] = [cb];}
			this.clip && this.clip.addEventListener(event,cb,false);
		},
		removeEventListener:function(event,cb){
			var index,
				cblist = this.events[event];
			if(cblist && (index = cblist.indexOf(cb))!==-1){
				if(cblist.length===1){delete this.events[event];}
				else{cblist.splice(index,1);}
			}
			this.clip && this.clip.removeEventListener(event,cb,false);
		},
		callHandlers:function(ename){
			var i,evt,handlers = this.events[ename];
			if(handlers){
				evt = document.createEvent("HTMLEvents");
				evt.initEvent(ename, true, true ); // event type,bubbling,cancelable
				for(i=handlers.length-1;i>=0;i--){
					handlers[i].call(this,evt);
				}
			}
		},
		Play:function() {this.clip.Play();},
		Pause:function() {this.clip.Pause();},
		
		set currentTime(val) { return this.clip?(this.clip.currentTime = val):0; },		// The current playback time in seconds
		get currentTime() { return this.clip?this.clip.currentTime:0; },
		
		set muted(mute) {
			this.attrs.muted = mute;
			this.clip && (this.clip.muted = mute);
			return mute;
		},
		get muted() {return this.attrs.muted;},
		
		set volume(val) { //The volume as a percentage
			this.attrs.volume = val;
			this.clip && (this.clip.volume = val);
			return val;
		},
		get volume() {return this.attrs.volume;},
		
		get duration() {return this.clip?this.clip.duration:0;},		//The duration in seconds
		
		get supportsControls() {return this.clip && this.clip.supportsControls;},
		get supportsFullscreen() {return this.clip && this.clip.supportsFullscreen;},
		get supportsResizescreen() {return this.clip && this.clip.supportsResizescreen;},
		EnterFullscreen:function() {return this.clip && this.clip.EnterFullscreen();},
		LeaveFullscreen:function() {return this.clip && this.clip.LeaveFullscreen();},
		LoadClip:function(clip,start,end){
			clip = ((typeof clip=="string")
				?Clip(clip,start,end)
				:clip);
			clip.Attach(this);
			clip.muted = this.attrs.muted;
			clip.volume = this.attrs.volume;
		},
		DetachClip:function(){
			var clip = this.clip;
			if(clip){
				clip.Pause();
				clip.Detach();
			}
		}
	};
	
	function Stage(element){
		if(!(this instanceof Stage)){return new Stage(element);}
		var aspect_control = document.createElement('div'),
			aspect_element = document.createElement('div'),
			content = document.createElement('div'),
			controls = document.createElement('div');
			
		aspect_control.style.marginTop = "25%";
		
		/*TODO:
			Build Controls
			*/
		
		aspect_element.className = "aspect_element";
		aspect_element.appendChild(content);
		aspect_element.appendChild(controls);
		element.innerHTML = "";
		element.classList.add("aspect_container");
		element.appendChild(aspect_control);
		element.appendChild(aspect_element);
		this.element = aspect_element;
		this.controls = controls;
		this.events = [];
		this.frame = Object.create(this,{
			element: {value: content},
			clip: {
				set: function(val){this.clip=val;}.bind(this),
				get: function(){return this.clip;}.bind(this)
			}
		});
		Object.defineProperties(this,{
			aspect: {
				set: function(val){
					val = +val;
					aspect_control.style.marginTop = val+"%";
					return val;
				},
				get: function(){return +aspect_control.style.marginTop;},
				enumerable: true
			},
			Resize: {
				value: function(width,height) {
					aspect_control.style.marginTop = (
						typeof height === 'undefined'
						?width
						:(100*height/width))+"%";
				},
				enumerable: true
			}
		});
		this.attrs = {};
	}
	
	Stage.prototype = Object.create(Video.prototype,{
		PlayList: {
			value: function(evlist){
				var seq = 0,
					duration = 0,
					newlist = [];
				evlist.map(function(ev,index){
					newlist[index] = {
						res: new Clip(ev.srcs[0],ev.start,ev.stop),
						begin: seq,
						end: seq + ev.stop - ev.start,
						next: ev.next
					}
					seq += ev.next;
					if(ev.end > duration){duration = ev.end;}
				});
				this.playlist = {events: newlist, duration: duration};
				this.index = -1;
			}
		},
		Play: {
			value: function(){
				//TODO fix it up to keep track of the whole time continuum, not just edges of clips
				this.Next();
			}
		},
		Next: {
			value: function(){
				var evlist = this.playlist.events,
					clip;
				this.index++;
				if(this.index<evlist.length){
					console.log("Starting clip ",this.index);
					clip = evlist[this.index].res;
					clip.Attach(this.frame);
					clip.Play();
				}
			}
		}
	});
	
	//Load the stage stylesheet asynchronously.
	(function(){
		var tag = document.createElement("link");
		tag.setAttribute("rel", "stylesheet");
		tag.setAttribute("type", "text/css");
		tag.setAttribute("href", "stage.css");
		document.getElementsByTagName("head")[0].appendChild(tag);
	}());
	
	function uninitError(){throw "Ayamel Uninitialized";}
	if(!global.Ayamel){
		var _ayamel = {
			genFrame:document.createElement('iframe'),
			Clip:Clip
		};
		with(_ayamel){
			genFrame.style.width = "100%";
			genFrame.style.height = "100%";
			genFrame.style.position = "absolute";
			genFrame.frameBorder = "0";
			//	genFrame.sandbox = "allow-same-origin";
			genFrame.mozallowfullscreen = true;
			genFrame.seamless = true;
		}
		Ayamel = {
			Stage:Stage,
			Video:Video,
			Clip:Clip,
			InstallPlayers:function(installers,cb){
				var done = false,
					waitcount = 0;
				installers.map(function(installer,index){
					waitcount--;
					installer(_ayamel,global,function(cons){
						VCons[index] = cons;
						if(++waitcount === 0 && done && cb) cb();
					});
				});

				if(waitcount===0 && cb){cb();}
				else{done = true;}
			},
			AddPlayer:function(installer,priority,cb){
				installer(_ayamel,global,function(cons){
					VCons.splice(priority,0,cons);
					cb && cb();
				});
			}
		};
	}
}(window));