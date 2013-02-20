(function(global,Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	var VCons = [];
	
	function auto_pause(event){
		if(this.currentTime >= this.duration){
			this.Pause();
			this.fireEvent('ended');
		}
	}
			
	function Video(resource,start,stop){
		var self = this;
		if(!(this instanceof Video)){return new Video(resource,start,stop);}
		Ayamel.Actor.Dynamic.call(this);
		
		this.element = document.createElement('div');
		this.media = null;
		this.attrs = {
			muted: false,
			volume: 100,
			playing: false,
			playbackRate: 1,
			time: 0
		};
		
		this.events = {
			timeupdate: [
				function(){
					//updateDisplay.call(self,self.clip.currentTime);
				}
			],
			play: [function(){self.attrs.playing = true;}],
			pause: [function(){self.attrs.playing = false;}],
			ended: [function(){self.attrs.playing = false;}]
		};
		
		if(typeof resource === 'string'){
			$.ajax({
				type: "GET",
				url: resource,
				dataType: "json",
				success: function(response){
					resource = response.data;
					generate_clip();
				}
			});
		}else{ generate_clip(); }
		
		function generate_clip(){
			var i, clip;
			if(!start){start=0;}
			for(i = VCons.length-1;i>=0;i--){
				if(clip = VCons[i](resource,start,stop)){
					Object.defineProperties(clip ,{
						start: {value: start},
						stop: {get: function(){return stop||this.mediaDuration;}},
						duration: {get: function(){ return this.stop - this.start; }, enumerable: true},
						currentTime: {
							get: function(){ return this.mediaTime - this.start; },
							set: function(val){ return this.mediaTime = +val+this.start; },
							enumerable: true
						}
					});
					self.media = clip;
					self.element.appendChild(clip.media_el);
					clip.wrapper = self;
					clip.events = self.events;
					clip.currentTime = self.attrs.time||0;
					clip.media.volume = self.attrs.volume/100;
					clip.media.muted = self.attrs.muted;
					clip.media.playbackRate = self.attrs.playbackRate;
					clip.media.addEventListener('timeupdate',auto_pause.bind(clip),false);
					return;
				}
			}
			throw new Error("Could not play resource at " + res);
		}
	}
	
	Video.prototype = Object.create(Ayamel.Actor.Dynamic.prototype,{
		bindKeys: {
			value: function(){
				var self=this,
					spacebinding = function(e){
						e.repeat || self[self.attrs.playing?'Pause':'Play']();
					};
				Ayamel.keybindings = {
					32:	spacebinding,
					' ':spacebinding,
				};
			}
		}
	});
	
	Ayamel.VideoClipPrototype = Object.create(Ayamel.AyamelElement,{
		addEventListener: {value:function(){}},
		removeEventListener: {value:function(){}},
		fireEvent: {value:function(evt){ this.wrapper.fireEvent(evt); }}
	});
	
	Ayamel.InstallVideoPlayers = function(installers,cb){
		var done = false,
			waitcount = 0;
		installers.forEach(function(installer,index){
			waitcount--;
			installer(Ayamel,global,function(cons){
				VCons[index] = cons;
				if(++waitcount === 0 && done && cb) cb();
			});
		});
		if(waitcount===0 && cb){cb();}
		else{done = true;}
	};
	
	Ayamel.AddVideoPlayer = function(installer,priority,cb){
		installer(Ayamel,global,function(cons){
			VCons.splice(priority,0,cons);
			cb && cb();
		});
	};
	
	Ayamel.Video = Video;
}(window,Ayamel));