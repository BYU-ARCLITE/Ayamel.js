(function(Ayamel){
	"use strict";
	if(!Ayamel){ throw new Error("Ayamel Uninitialized"); }
	
	function Video(videoData){
		var self = this;
		if(!(this instanceof Video)){return new Video;}
		Ayamel.Actor.Dynamic.call(this);
		this.element = document.createElement('div');
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
		
		if(videoData instanceof Ayamel.Clip){
			videoData.Attach(this);
		}else{
			this.media = null;
			if(typeof videoData === 'string'){
				videoData = {
					startTime: 0,
					endTime: null,
					resource: videoData
				};
			}
			if(typeof videoData.resource === 'string'){
				$.ajax({
					type: "GET",
					url: videoData.resource,
					dataType: "json",
					success: function(res){
						videoData.resource = res.data;
						attach_clip();
					}
				});
			}else{ attach_clip(); }
		}
		
		function attach_clip(){
			(new Ayamel.Clip(videoData.resource, videoData.startTime, videoData.endTime)).Attach(self);
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
	
	Ayamel.Video = Video;
}(Ayamel));