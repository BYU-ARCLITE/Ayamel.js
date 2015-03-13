(function(Ayamel) {
	"use strict";

	var template = '<div class="ayamelPlayer"></div>';

	function processTime(time){
		if(typeof time === "number"){ return time; }
		return time.split(":").reduce(function(last, next){
			return last * 60 + (+next||0);
		}, 0);
	}

	function AyamelPlayer(args) {
		var that = this,
			resource = args.resource,
			element = Ayamel.utils.parseHTML(template),
			startTime = processTime(args.startTime || 0),
			endTime = processTime(args.endTime || -1),
			aspectRatio = +args.aspectRatio || Ayamel.aspectRatios.hdVideo,
			maxWidth = +args.maxWidth || (1/0),
			maxHeight = +args.maxHeight || (1/0),
			mediaPlayer, controlBar, renderCue;

		this.element = element;
		args.holder.appendChild(element);

		/*
		 * ==========================================================================================
		 *                                      Module Creation
		 * ==========================================================================================
		 */

		// Create the MediaPlayer
		mediaPlayer = new Ayamel.classes.MediaPlayer({
			stage: this,
			holder: element,
			resource: resource,
			startTime: startTime,
			endTime: endTime,
			annotations: args.annotations||{},
			captions: args.captions||{}
		});
		this.mediaPlayer = mediaPlayer;

		// Create the ControlBar
		controlBar = new Ayamel.classes.ControlBar({
			holder: element,
			components: args.components,
			mediaPlayer: mediaPlayer
		});
		this.controlBar = controlBar;

		// Create the Translator
		this.targetLang = args.targetLang || "eng";
		this.translator = null;
		if(args.translate){
			this.translator = new Ayamel.utils.Translator(translationEndpoint,translationKey);
			// Forward Events
			this.translator.addEventListener("translate", function(event){
				element.dispatchEvent(new CustomEvent("translate", {bubbles: true, detail: event.detail}));
			});
			this.translator.addEventListener("translation", function(event){
				element.dispatchEvent(new CustomEvent("translation", {bubbles: true, detail: event.detail}));
			});
			this.translator.addEventListener("error", function(event){
				element.dispatchEvent(new CustomEvent("translationError", {bubbles: true, detail: event.detail}));
			});
		}

		/*
		 * ==========================================================================================
		 *                                      Key bindings
		 * ==========================================================================================
		 */

		Ayamel.KeyBinder.addKeyBinding(Ayamel.KeyBinder.keyCodes.space, function(){
			// Don't do anything if in a text box
			if(["TEXTAREA", "INPUT"].indexOf(document.activeElement.nodeName) === -1){
				if(mediaPlayer.paused){
					mediaPlayer.play();
					controlBar.playing = true;
				}else{
					mediaPlayer.pause();
					controlBar.playing = false;
				}
			}
		});

		/*
		 * ==========================================================================================
		 *                                      Event handling
		 * ==========================================================================================
		 */

		//   Set up event listeners for the media player
		// -----------------------------------------------

		mediaPlayer.addEventListener("timeupdate", function(){
			controlBar.currentTime = mediaPlayer.currentTime;
		});

		mediaPlayer.addEventListener("durationchange", function(){
			controlBar.duration = mediaPlayer.duration;
		});

		mediaPlayer.addEventListener("ratechange", function(){
			controlBar.playbackRate = mediaPlayer.playbackRate;
		});

		mediaPlayer.addEventListener("volumechange", function(){
			controlBar.volume = mediaPlayer.volume;
		});

		mediaPlayer.addEventListener("ended", function(){ controlBar.playing = false; },false);
		mediaPlayer.addEventListener("pause", function(){ controlBar.playing = false; },false);
		mediaPlayer.addEventListener("play", function(){ controlBar.playing = true; },false);

		//   Set up event listeners for the control bar
		// ----------------------------------------------

		// When the user is done scrubbing, seek to that position
		controlBar.addEventListener("scrubend", function(event){
			mediaPlayer.currentTime = event.detail.progress * mediaPlayer.duration;
		});

		// Play the media when the play button is pressed
		controlBar.addEventListener("play", function(){
			try{ event.stopPropagation(); }catch(e){} // Firefox Compatibility
			mediaPlayer.play();
		});

		// Pause the media when the pause button is pressed
		controlBar.addEventListener("pause", function(){
			try{ event.stopPropagation(); }catch(e){} // Firefox Compatibility
			mediaPlayer.pause();
		});

		// 
		controlBar.addEventListener("captionJump", function(event){
			// Find the first visible track
			var track = that.captionRenderer.tracks.filter(function(track){
				return track.mode === "showing";
			})[0];
			if(track){ // Move forward or back a caption
				var traversal = Ayamel.utils.CaptionsTranversal[event.detail.direction];
				that.currentTime = traversal(track, that.currentTime);
			}
		});

		// Change the volume when the volume controls are adjusted
		controlBar.addEventListener("volumechange", function(event){
			try{ event.stopPropagation(); }catch(e){} // Firefox Compatibility
			mediaPlayer.volume = event.detail.volume;
			controlBar.volume = mediaPlayer.volume;
		});

		// Change the playback rate when the rate controls are adjusted
		controlBar.addEventListener("ratechange", function(event){
			try{ event.stopPropagation(); }catch(e){} // Firefox Compatibility
			mediaPlayer.playbackRate = event.detail.playbackRate;
			controlBar.playbackRate = mediaPlayer.playbackRate;
		});

		// Mute/unmute the media when the mute button is pressed
		controlBar.addEventListener("mute", function(){
			try{ event.stopPropagation(); }catch(e){} // Firefox Compatibility
			that.muted = true;
			controlBar.muted = that.muted;
		});
		controlBar.addEventListener("unmute", function(){
			try{ event.stopPropagation(); }catch(e){} // Firefox Compatibility
			that.muted = false;
			controlBar.muted = that.muted;
		});

		// Rebuild captions when tracks are enabled or disabled.
		controlBar.addEventListener("enabletrack", function(event){
			that.captionRenderer.rebuildCaptions();
		});
		controlBar.addEventListener("disabletrack", function(event){
			that.captionRenderer.rebuildCaptions();
		});

		// Rebuild captions when annotation sets are enabled or disabled.
		controlBar.addEventListener("enableannset", function(event){
			that.annotator.refresh();
			that.captionRenderer.rebuildCaptions();
		});
		controlBar.addEventListener("disableannset", function(event){
			that.annotator.refresh();
			that.captionRenderer.rebuildCaptions();
		});

		//Enter/exit full screen when the button is pressed
		controlBar.addEventListener("enterfullscreen", function(e){
			e.stopPropagation();
			Ayamel.utils.FullScreen.enter(element);
		});

		controlBar.addEventListener("exitfullscreen", function(e){
			e.stopPropagation();
			Ayamel.utils.FullScreen.exit();
		});

		// Handle changes to fullscreen mode
		document.addEventListener(Ayamel.utils.FullScreen.fullScreenEvent,function(){
			var availableHeight;
			if(Ayamel.utils.FullScreen.fullScreenElement === element){
				// Figure out how much space we have for the media player to fill
				availableHeight = Ayamel.utils.FullScreen.availableHeight
					- controlBar.height;
				mediaPlayer.enterFullScreen(availableHeight);
				controlBar.fullScreen = true;
				element.dispatchEvent(new CustomEvent('enterfullscreen',{bubbles:true}));
			}else{
				mediaPlayer.exitFullScreen();
				controlBar.fullScreen = false;
				element.dispatchEvent(new CustomEvent('exitfullscreen',{bubbles:true}));
			}
		},false);

		/*
		 * ==========================================================================================
		 *                                      Attributes
		 * ==========================================================================================
		 */

		Object.defineProperties(this, {
			annotator: {
				get: function(){ return mediaPlayer.annotator; }
			},
			captionRenderer: {
				get: function(){ return mediaPlayer.captionRenderer; }
			},
			duration: {
				get: function(){ return mediaPlayer.duration; }
			},
			currentTime: {
				get: function(){ return mediaPlayer.currentTime; },
				set: function(time){
					var newtime,
						oldtime = mediaPlayer.currentTime;
					mediaPlayer.currentTime = (+time||0);
					newtime = mediaPlayer.currentTime;
					element.dispatchEvent(new CustomEvent('timejump', {
						bubbles:true,
						detail: { oldtime: oldtime, newtime: newtime }
					}));
					return newtime;
				}
			},
			muted: {
				get: function(){
					return mediaPlayer.muted;
				},
				set: function(muted){
					var m = mediaPlayer.muted;
					mediaPlayer.muted = muted;
					if(mediaPlayer.muted !== m){
						element.dispatchEvent(new CustomEvent(m?'unmute':'mute', {bubbles:true}));
						return !m;
					}
				}
			},
			paused: {
				get: function(){ return mediaPlayer.paused; }
			},
			playbackRate: {
				get: function(){ return mediaPlayer.playbackRate; },
				set: function(playbackRate){
					return mediaPlayer.playbackRate = playbackRate;
				}
			},
			readyState: {
				get: function(){ return mediaPlayer.readyState; }
			},
			volume: {
				get: function(){ return mediaPlayer.volume; },
				set: function(volume){
					return mediaPlayer.volume = volume;
				}
			},
			aspectRatio: {
				get: function(){ return aspectRatio; },
				set: function(r){
					aspectRatio = +r || Ayamel.aspectRatios.hdVideo;
					this.resetSize();
					return aspectRatio;
				}
			},
			width: {
				get: function(){ return element.clientWidth; }
			},
			height: {
				get: function(){ return element.clientHeight; }
			},
			maxWidth: {
				get: function(){ return maxWidth; },
				set: function(w){
					w = +w;
					if(w){
						maxWidth = w;
						this.resetSize();
					}
					return maxWidth;
				}

			},
			maxHeight: {
				get: function(){ return maxHeight; },
				set: function(h){
					h = +h;
					if(h){
						maxHeight = h;
						this.resetSize();
					}
					return maxHeight;
				}
			}
		});

		this.resize = function(w, h){
			maxWidth = +w || maxWidth;
			maxHeight = +h || maxHeight;
			this.resetSize();
		};

		this.resetSize();
	}

	Object.defineProperties(AyamelPlayer.prototype,{
		textTracks: {
			get: function(){ return this.captionRenderer?this.captionRenderer.tracks:[]; },
			enumerable: true
		}
	});

	AyamelPlayer.prototype.addTextTrack = function(track){
		if(!this.captionRenderer){ return; }
		if(this.captionRenderer.tracks.indexOf(track) !== -1){ return; }
		this.captionRenderer.addTextTrack(track);
		if(this.controlBar.components.captions){
			this.controlBar.components.captions.addTrack(track);
		}
	};

	AyamelPlayer.prototype.removeTextTrack = function(track){
		if(!this.captionRenderer){ return; }
		if(this.captionRenderer.tracks.indexOf(track) === -1){ return; }
		this.captionRenderer.removeTextTrack(track);
		if(this.controlBar.components.captions){
			this.controlBar.components.captions.removeTrack(track);
		}
	};

	AyamelPlayer.prototype.refreshCaptionMenu = function(){
		if(!this.captionRenderer){ return; }
		if(!this.controlBar.components.captions){ return; }
		this.controlBar.components.captions.rebuild(this.captionRenderer.tracks);
	};

	AyamelPlayer.prototype.addAnnSet = function(annset){
		if(!this.annotator){ return; }
		var added = this.annotator.addSet(annset);
		if(added){
			if(this.captionRenderer && annset.mode === "showing"){
				this.captionRenderer.rebuildCaptions(true);
			}
			if(this.controlBar.components.annotations){
				this.controlBar.components.annotations.addSet(annset);
			}
		}
	};

	AyamelPlayer.prototype.removeAnnSet = function(annset){
		if(!this.annotator){ return; }
		var removed = this.annotator.removeSet(annset);
		if(removed){
			if(this.captionRenderer && annset.mode === "showing"){
				this.captionRenderer.rebuildCaptions(true);
			}
			if(this.controlBar.components.annotations){
				this.controlBar.components.annotations.addSet(annset);
			}
		}
	};

	AyamelPlayer.prototype.refreshAnnotationMenu = function(){
		if(!this.annotator){ return; }
		if(!this.controlBar.components.annotations){ return; }
		this.controlBar.components.annotations.rebuild(this.annotator.annotations);
	};

	AyamelPlayer.prototype.refreshAnnotations = function(){
		if(!this.annotator){ return; }
		this.annotator.refresh();
		if(this.captionRenderer){ this.captionRenderer.rebuildCaptions(true); }
	};

	AyamelPlayer.prototype.refreshAnnotationMenu = function(){
		if(!this.annotator){ return; }
		if(!this.controlBar.components.annotations){ return; }
		this.controlBar.components.captions.rebuild(this.annotator.annotations);
	};

	AyamelPlayer.prototype.play = function(){
		this.mediaPlayer.play();
	};

	AyamelPlayer.prototype.pause = function(){
		this.mediaPlayer.pause();
	};

	AyamelPlayer.prototype.addEventListener = function(event, callback, capture){
		this.element.addEventListener(event, callback, !!capture);
	};

	AyamelPlayer.prototype.removeEventListener = function(event, callback, capture){
		this.element.removeEventListener(event, callback, !!capture);
	};


	AyamelPlayer.prototype.resetSize = function(){
		var resizeWidth,
			el = this.element,
			ar = this.aspectRatio,
			mw = this.maxWidth,
			mh = this.maxHeight;
		do{ // Resize until it fills the most space avaliable
			resizeWidth = el.clientWidth;
			Ayamel.utils.fitAspectRatio(el, ar, mw, mh);
			this.mediaPlayer.height = el.offsetHeight;
		}while(el.clientWidth != resizeWidth);
		this.controlBar.resize();
	};

	Ayamel.classes.AyamelPlayer = AyamelPlayer;
}(Ayamel));