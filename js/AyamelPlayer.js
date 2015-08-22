(function(Ayamel) {
	"use strict";

	function processTime(time){
		if(typeof time === "number"){ return time; }
		return time.split(":").reduce(function(last, next){
			return last * 60 + (+next||0);
		}, 0);
	}

	function cue_handler(player, type, e){
		var cue = e.target,
			text = cue.text,
			data;

		if(cue.track.kind !== "metadata"){ return; }
		if(text.substr(0,13) !== "[AyamelEvent]"){ return; }
		try{ data = JSON.parse(text.substr(13))[type]; }
		catch(_){ return; }
		if(typeof data !== "object"){ return; }
		if(data.events instanceof Array){
			data.events.forEach(function(e){
				player.element.dispatchEvent(new CustomEvent(e.name, {bubbles: e.bubbles, detail: e.detail}));
			});
		}
		//TODO: Implement player commands
	}

	function registerCueHandlers(enter, exit, e){
		e.detail.track.cues.forEach(function(cue){
			cue.addEventListener('enter', enter, false);
			cue.addEventListener('exit', exit, false);
		})
	}

	function removeCueHandlers(enter, exit, e){
		e.detail.track.cues.forEach(function(cue){
			cue.removeEventListener('enter', enter, false);
			cue.removeEventListener('exit', exit, false);
		})
	}

	function AyamelPlayer(args){
		window.a = this;
		var that = this,
			resource = args.resource,
			element = document.createElement('div'),
			startTime = processTime(args.startTime || 0),
			endTime = processTime(args.endTime || -1),
			aspectRatio = +args.aspectRatio || Ayamel.aspectRatios.hdVideo,
			maxWidth = +args.maxWidth || (1/0),
			maxHeight = +args.maxHeight || (1/0),
			tabs = (args.tabs instanceof Array) ? {right: args.tabs} : (args.tabs || {}),
			mediaPlayer, readyPromise, cue_enter, cue_exit;

		element.className = "ayamelPlayer";
		this.element = element;
		args.holder.appendChild(element);

		/*
		 * ==========================================================================================
		 *                                      Module Creation
		 * ==========================================================================================
		 */

		// Create the Translator
		this.translator = null;
		if(args.translator){
			this.translator = new Ayamel.classes.Translator({
				endpoint: args.translator.endpoint,
				key: args.translator.key,
				targetLang: args.translator.targetLang || "eng"
			});
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

		var topPane = document.createElement("div");
		topPane.className = "topPane";
		element.appendChild(topPane);

		// Create the MediaPlayer
		mediaPlayer = new Ayamel.classes.MediaPlayer({
			holder: topPane,
			resource: resource,
			startTime: startTime,
			endTime: endTime,
			translator: this.translator,
			annotations: args.annotations||{},
			captions: args.captions||{},
			soundtracks: args.soundtracks||{}
		});

		this.mediaPlayer = mediaPlayer;

		this.rightBar = null;
		if(tabs.right instanceof Array){
			//Create the right sidebar
			this.rightBar = new Ayamel.classes.Sidebar({
				holder: topPane,
				player: this,
				side: 'right',
				tabs: tabs.right
			});
		}

		this.leftBar = null;
		if(tabs.left instanceof Array){
			//Create the left sidebar
			this.leftBar = new Ayamel.classes.Sidebar({
				holder: topPane,
				player: this,
				side: 'left',
				tabs: tabs.left
			});
		}

		// set up event track handling
		cue_enter = cue_handler.bind(null, this, 'enter');
		cue_exit = cue_handler.bind(null, this, 'exit');
		this.addEventListener('addtexttrack', registerCueHandlers.bind(null,cue_enter,cue_exit), false);
		this.addEventListener('removetexttrack', removeCueHandlers.bind(null,cue_enter,cue_exit), false);

		// finish set up when media player has loaded
		readyPromise = mediaPlayer.promise.then(function(mediaPlayer){

			// Create the ControlBar
			var controlBar = new Ayamel.classes.ControlBar({
				holder: element,
				components: args.components,
				ayamelPlayer: that,
				mediaPlayer: mediaPlayer
			});
			that.controlBar = controlBar;
			that.resetSize();

			/* ================================================================
			 *                          Key bindings
			 * ================================================================ */

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
			
			/* ================================================================
			 *                        Event handling
			 * ================================================================ */

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
				controlBar.muted = mediaPlayer.muted;
			});

			mediaPlayer.addEventListener("ended", function(){ controlBar.playing = false; },false);
			mediaPlayer.addEventListener("pause", function(){ controlBar.playing = false; },false);
			mediaPlayer.addEventListener("play", function(){ controlBar.playing = true; },false);

			//   Set up event listeners for the control bar
			// ----------------------------------------------

			// When the user is done scrubbing, seek to that position
			controlBar.addEventListener("scrubend", function(event){
				var oldTime = mediaPlayer.currentTime;
				mediaPlayer.currentTime = event.detail.progress * mediaPlayer.duration;
				that.element.dispatchEvent(new CustomEvent('timejump', {
					bubbles:true,
					detail: { oldtime: oldTime, newtime: mediaPlayer.currentTime }
				}));
			});

			// Play the media when the play button is pressed
			controlBar.addEventListener("play", function(){
				try{ event.stopPropagation(); }catch(ignore){} // Firefox Compatibility
				mediaPlayer.play();
			});

			// Pause the media when the pause button is pressed
			controlBar.addEventListener("pause", function(){
				try{ event.stopPropagation(); }catch(ignore){} // Firefox Compatibility
				mediaPlayer.pause();
			});

			// Change the volume when the volume controls are adjusted
			controlBar.addEventListener("volumechange", function(event){
				var isFirefox = typeof InstallTrigger !== 'undefined';
				if (isFirefox) {
					try{ event.stopPropagation(); }catch(ignore){} // Firefox Compatibility	
				}
				mediaPlayer.volume = event.detail.volume;
				controlBar.volume = mediaPlayer.volume;
			});

			// Change the playback rate when the rate controls are adjusted
			controlBar.addEventListener("ratechange", function(event){
				try{ event.stopPropagation(); }catch(ignore){} // Firefox Compatibility
				mediaPlayer.playbackRate = event.detail.playbackRate;
				controlBar.playbackRate = mediaPlayer.playbackRate;
			});

			// Mute/unmute the media when the mute button is pressed
			controlBar.addEventListener("mute", function(){
				// http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
				// seems to work
				var isFirefox = typeof InstallTrigger !== 'undefined';
				if (isFirefox) {
					try{ event.stopPropagation(); }catch(ignore){} // Firefox Compatibility	
				}
				mediaPlayer.muted = true;
				controlBar.muted = mediaPlayer.muted;
			});
			controlBar.addEventListener("unmute", function(){
				var isFirefox = typeof InstallTrigger !== 'undefined';
				if (isFirefox) {
					try{ event.stopPropagation(); }catch(ignore){} // Firefox Compatibility	
				}
				mediaPlayer.muted = false;
				controlBar.muted = mediaPlayer.muted;
			});

			//Caption controls
			controlBar.addEventListener("captionJump", function(event){
				mediaPlayer.cueJump(event.detail.direction);
			});

			// Rebuild captions when tracks are enabled or disabled.
			controlBar.addEventListener("enabletrack", function(){
				mediaPlayer.rebuildCaptions();
			});
			controlBar.addEventListener("disabletrack", function(){
				mediaPlayer.rebuildCaptions();
			});

			// Turn soundtracks on and off.
			controlBar.addEventListener("enableaudio", function(e){
				mediaPlayer.enableAudio(e.detail);
			});
			controlBar.addEventListener("disableaudio", function(e){
				mediaPlayer.disableAudio(e.detail);
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
				var fsHeight, fsWidth;
				if(Ayamel.utils.FullScreen.fullScreenElement === element){
					// Figure out how much space we have for the media player to fill
					fsHeight = Ayamel.utils.FullScreen.availableHeight
						- controlBar.height;
					fsWidth = Ayamel.utils.FullScreen.availableWidth;
					mediaPlayer.enterFullScreen(fsHeight,fsWidth);
					controlBar.fullScreen = true;
					element.dispatchEvent(new CustomEvent('enterfullscreen',{bubbles:true}));
				}else{
					mediaPlayer.exitFullScreen();
					controlBar.fullScreen = false;
					element.dispatchEvent(new CustomEvent('exitfullscreen',{bubbles:true}));
				}
			},false);
		});

		this.then = readyPromise.then.bind(readyPromise);

		/* ================================================================
		 *                           Attributes
		 * ================================================================ */

		this.resize = function(w, h){
			maxWidth = +w || maxWidth;
			maxHeight = +h || maxHeight;
			this.resetSize();
		};

		Object.defineProperties(this, {
			aspectRatio: {
				get: function(){ return aspectRatio; },
				set: function(r){
					aspectRatio = +r || Ayamel.aspectRatios.hdVideo;
					this.resetSize();
					return aspectRatio;
				}
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
	}

	AyamelPlayer.prototype = {
		get width(){ return this.element.clientWidth; },
		get height(){ return this.element.clientHeight; },
		get textTracks(){ return this.mediaPlayer.textTracks; },
		get targetLang(){
			return this.translator ? this.translator.targetLang : "eng";
		},
		set targetLang(lang){
			if(this.translator){
				return this.translator.targetLang = ""+lang;
			}
			return "eng";
		},
		get readyState(){ return this.mediaPlayer.readyState; },
		get duration(){ return this.mediaPlayer.duration; },
		play: function(){ this.mediaPlayer.play(); },
		pause: function(){ this.mediaPlayer.pause(); },
		get currentTime(){ return this.mediaPlayer.currentTime; },
		set currentTime(time){
			var newtime,
				oldtime = this.mediaPlayer.currentTime;
			this.mediaPlayer.currentTime = (+time||0);
			newtime = this.mediaPlayer.currentTime;
			this.element.dispatchEvent(new CustomEvent('timejump', {
				bubbles:true,
				detail: { oldtime: oldtime, newtime: newtime }
			}));
			return newtime;
		},
		get muted(){ return this.mediaPlayer.muted; },
		set muted(muted){
			var m = this.mediaPlayer.muted;
			this.mediaPlayer.muted = muted;
			if(this.mediaPlayer.muted !== m){
				this.element.dispatchEvent(new CustomEvent(
					m?'unmute':'mute', {bubbles:true}
				));
			}
			return this.mediaPlayer.muted;
		},
		get paused(){ return this.mediaPlayer.paused; },
		get playbackRate(){ return this.mediaPlayer.playbackRate; },
		set playbackRate(rate){ return this.mediaPlayer.playbackRate = rate; },
		get volume(){ return this.mediaPlayer.volume; },
		set volume(volume){ return this.mediaPlayer.volume = volume; },
		get isFullScreen(){ return Ayamel.utils.FullScreen.fullScreenElement === this.element; },
		addTextTrack: function(track){
			this.mediaPlayer.addTextTrack(track);
			if(this.controlBar.components.captions){
				this.controlBar.components.captions.addTrack(track);
			}
		},
		removeTextTrack: function(track){
			this.mediaPlayer.removeTextTrack(track);
			if(this.controlBar.components.captions){
				this.controlBar.components.captions.removeTrack(track);
			}
		},
		refreshCaptionMenu: function(){
			if(!this.controlBar.components.captions){ return; }
			this.controlBar.components.captions.rebuild(this.textTracks);
		},
		addAnnSet: function(annset){
			this.mediaPlayer.addAnnSet(annset);
			if(this.controlBar.components.annotations){
				this.controlBar.components.annotations.addSet(annset);
			}
		},
		removeAnnSet: function(annset){
			this.mediaPlayer.removeAnnSet(annset);
			if(this.controlBar.components.annotations){
				this.controlBar.components.annotations.removeSet(annset);
			}
		},
		refreshAnnotationMenu: function(){
			if(!this.annotator){ return; }
			if(!this.controlBar.components.annotations){ return; }
			this.controlBar.components.annotations.rebuild(this.annotator.annotations);
		},
		refreshAnnotations: function(){
			this.mediaPlayer.refreshAnnotations();
		},
		addEventListener: function(event, callback, capture){
			this.element.addEventListener(event, callback, !!capture);
		},
		removeEventListener: function(event, callback, capture){
			this.element.removeEventListener(event, callback, !!capture);
		},
		resetSize: function(){
			var resizeWidth,
				rwidth, lwidth,
				el = this.element,
				ar = this.aspectRatio,
				mw = this.maxWidth,
				mh = this.maxHeight;
			do{ // Resize until it fills the most space avaliable
				resizeWidth = el.clientWidth;
				Ayamel.utils.fitAspectRatio(el, ar, mw, mh);
				this.mediaPlayer.height = el.offsetHeight;
				lwidth = this.leftBar ? this.leftBar.offsetWidth : 0;
				rwidth = this.rightBar ? this.rightBar.offsetWidth : 0;
				this.mediaPlayer.width = resizeWidth - lwidth - rwidth - 1;
			}while(el.clientWidth !== resizeWidth);
			if(this.controlBar){ this.controlBar.resize(); }
			this.mediaPlayer.rebuildCaptions(true);
		},
		destroy: function(){
			var el = this.element;
			this.mediaPlayer.destroy();
			if(el.parentElement){ el.parentElement.removeChild(el); }
		}
	};

	Ayamel.classes.AyamelPlayer = AyamelPlayer;
}(Ayamel));