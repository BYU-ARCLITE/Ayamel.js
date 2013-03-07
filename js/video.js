(function(global,Ayamel){
	"use strict";
	if(!Ayamel){
		throw new Error("Ayamel Uninitialized");
	}
	
	var VCons = [],
		gen_div = document.createElement('div');
	
	gen_div.style.position = "absolute";
	gen_div.style.visibility = "hidden";
	gen_div.style.height = "100%";
	gen_div.style.width = "100%";
	
	function auto_pause(event){
		if(this.currentTime >= this.duration){
			this.Pause();
			this.callHandlers('ended');
		}
	}
			
	function Video(parent,resource,start,stop){
		var xhr, self = this;
		if(!(this instanceof Video)){return new Video(resource,start,stop);}
		Ayamel.TimedMedia.call(this,{
			element: gen_div.cloneNode(false),
			attrs: parent.attrs||{
				muted: false,
				volume: 100,
				playing: false,
				playbackRate: 1,
				time: 0
			},
			events: parent.events||{
				play: [function(){self.attrs.playing = true;}],
				pause: [function(){self.attrs.playing = false;}],
				ended: [function(){self.attrs.playing = false;}]
			}
		});
		
		this.parent = parent;
		parent.contentElement.appendChild(this.element);
		
		if(typeof resource === 'string'){
			xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function(){
				if(this.readyState == 4){
					((this.status >= 200 && this.status < 400)?
					function(response){
						generate_clip(JSON.parse(response).data);
					}:function(response){
						alert("An error was encountered retrieving the video resource: " + response);
					})(this.responseText);
				}
			};
			xhr.open("GET",resource,true);
			xhr.send();
		}else{ generate_clip(resource); }
		
		function generate_clip(resource){
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
	
	Video.prototype = Object.create(Ayamel.TimedMedia.prototype,{
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
		},
		Activate: {
			value: function(time){
				var media = this.media;
				if(media){
					media.volume = this.attrs.volume;
					media.muted = this.attrs.muted;
					media.playbackRate = this.attrs.playbackRate;
				}
				this.currentTime = time||0;
				this.element.style.visibility = "visible";
			}
		},
		Deactivate: {
			value: function(){
				this.media && this.media.Pause();
				this.element.style.visibility = "hidden";
			}
		}
	});
	
	Ayamel.VideoClipPrototype = Object.create(Ayamel.AyamelElement,{
		addEventListener: {value:function(){}},
		removeEventListener: {value:function(){}},
		callHandlers: {value:function(evt){ this.wrapper.callHandlers(evt); }}
	});

    /**
     * Installs multiple video players.
     * @param installers An array of video installers. The order is the priority
     * @param cb A callback function
     */
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

    /**
     * Installs a video player
     * @param installer The video installer.
     * @param priority The priority of the player. Lower the number the more preferred the player
     * @param cb A callback function
     */
	Ayamel.AddVideoPlayer = function(installer,priority,cb){
		installer(Ayamel,global,function(cons){
			VCons.splice(priority,0,cons);
			cb && cb();
		});
	};
	
	Ayamel.Video = Video;
}(window,Ayamel));