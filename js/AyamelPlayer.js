(function(Ayamel) {
	"use strict";

	var template = '<div class="ayamelPlayer"></div>';

	function processTime(time) {
		if (typeof time === "number") {
			return time;
		}
		return time.split(":").reduce(function(last, next){
			return last * 60 + (+next||0);
		}, 0);
	}

	function AyamelPlayer(args) {
		var that = this,
			element = Ayamel.utils.parseHTML(template),
			startTime = processTime(args.startTime || 0),
			endTime = processTime(args.endTime || -1),
			resMap = new Map, indexMap = new Map, mimeMap = new Map,
			aspectRatio = +args.aspectRatio || Ayamel.aspectRatios.hdVideo,
			maxWidth = +args.maxWidth || (1/0),
			maxHeight = +args.maxHeight || (1/0),
			mediaPlayer, controlBar, resizeWidth, renderCue;

		this.element = element;
		args.holder.appendChild(element);

		this.textTrackResources = resMap;
		this.textTrackMimes = mimeMap;

		/*
		 * ==========================================================================================
		 *                                      Module Creation
		 * ==========================================================================================
		 */

		// Create the MediaPlayer
		mediaPlayer = new Ayamel.classes.MediaPlayer({
			holder: element,
			resource: args.resource,
			startTime: startTime,
			endTime: endTime
		});

		this.mediaPlayer = mediaPlayer;

		// Create the ControlBar
		controlBar = new Ayamel.classes.ControlBar({
			holder: element,
			components: args.components,
			pluginFeatures: mediaPlayer.plugin.features
		});
		this.controlBar = controlBar;

		// Create the Translator
		this.targetLang = args.targetLang || "eng";
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
		}else{
			this.translator = null;
		}

		if(args.annotations){
			this.annotator = new Ayamel.Annotator({
				handler: function(data, lang, text, index){
					element.dispatchEvent(new CustomEvent("annotation", {
						bubbles: true,
						detail: {data: data, lang: lang, text: text, index: index}
					}));
				}
			}, args.annotations);
		}else{
			this.annotator = null;
		}

		// Create the caption renderer
		if(mediaPlayer.captionsElement){
			if(args.captionRenderer instanceof TimedText.CaptionRenderer){
				this.captionRenderer = args.captionRenderer;
				this.captionRenderer.target = this.mediaPlayer.captionsElement;
				this.captionRenderer.appendCueCanvasTo = this.mediaPlayer.captionsElement;
			}else{
				renderCue = args.renderCue || function(renderedCue, area){
					var txt, annotate,
						cue = renderedCue.cue;

					if(that.annotator){
						annotate = function(n){
							that.annotator.index = indexMap.get(cue);
							return that.annotator.HTML(n);
						};
					}

					txt = new Ayamel.Text({
						content: cue.getCueAsHTML(renderedCue.kind === 'subtitles'),
						processor: annotate
					});

					// Attach the translator
					if(that.translator){
						txt.addEventListener('selection',function(event){
							that.translator.translate({
								srcLang: cue.track.language,
								destLang: that.targetLang,
								text: event.detail.fragment.textContent.trim(),
								data: {
									cue: cue,
									sourceType: "caption"
								}
							});
						},false);
					}

					renderedCue.node = txt.displayElement;
				};

				this.captionRenderer = new TimedText.CaptionRenderer({
					target: mediaPlayer.captionsElement,
					appendCueCanvasTo: mediaPlayer.captionsElement,
					renderCue: renderCue
				});
			}
			this.captionRenderer.bindMediaElement(mediaPlayer);
		}

		// Load the caption tracks
		Promise.all((args.captionTracks||[]).map(function(resource){
			return new Promise(function(resolve, reject){
				Ayamel.utils.loadCaptionTrack(resource, function(track, mime){
					var i, cue, offset = 0,
						cueList = track.cues;

					that.addTextTrack(track);

					mimeMap.set(track, mime);
					resMap.set(track, resource);

					for(i = 0; cue = cueList[i]; i++){
						indexMap.set(cueList[i], offset);
						offset += cueList[i].getCueAsHTML().textContent;
					}

					resolve(track);
				}, function(err){
					resolve(null);
				});
			});
		})).then(function(tracks){
			element.dispatchEvent(new CustomEvent('loadtexttracks', {
				bubbles:true,
				detail: {
					tracks: tracks.filter(function(track){ return track !== null; }),
					resources: resMap,
					mimes: mimeMap
				}
			}));
		});

		/*
		 * ==========================================================================================
		 *                                      Key bindings
		 * ==========================================================================================
		 */

		Ayamel.KeyBinder.addKeyBinding(Ayamel.KeyBinder.keyCodes.space, function() {
			// Don't do anything if in a text box
			if (["TEXTAREA", "INPUT"].indexOf(document.activeElement.nodeName) === -1) {
				if (mediaPlayer.paused) {
					mediaPlayer.play();
					controlBar.playing = true;
				} else {
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

		// Update the control bar when the media is playing
		mediaPlayer.addEventListener("timeupdate", function(){
			// It's ok to lie to the control bar about the time
			controlBar.currentTime = mediaPlayer.currentTime - startTime;
		});

		// When duration changes (such as on a load), notify the control bar
		mediaPlayer.addEventListener("durationchange", function(){
			// It's ok to lie to the control bar about the time
			var duration = endTime === -1 ? mediaPlayer.duration : endTime;
			controlBar.duration = duration - startTime;
		});

		mediaPlayer.addEventListener("ended", function(){ controlBar.playing = false; }, false);
		mediaPlayer.addEventListener("pause", function(){ controlBar.playing = false; }, false);
		mediaPlayer.addEventListener("play", function(){ controlBar.playing = true; }, false);

		//   Set up event listeners for the control bar
		// ----------------------------------------------

		// When the user is done scrubbing, seek to that position
		controlBar.addEventListener("scrubend", function(event){
			// If we have been lying to the control bar, then keep that in mind
			var length = (endTime === -1 ? that.mediaPlayer.duration : endTime) - startTime;
			mediaPlayer.currentTime = event.detail.progress * length + startTime;
		});

		// Play the media when the play button is pressed
		controlBar.addEventListener("play", function(){
			try { event.stopPropagation(); } catch (e) {} // Firefox Compatibility
			mediaPlayer.play();
		});

		// Pause the media when the pause button is pressed
		controlBar.addEventListener("pause", function(){
			try { event.stopPropagation(); } catch (e) {} // Firefox Compatibility
			mediaPlayer.pause();
		});

		// Change the volume when the volume controls are adjusted
		controlBar.addEventListener("volumechange", function(event){
			try { event.stopPropagation(); } catch (e) {} // Firefox Compatibility
			mediaPlayer.volume = event.detail.volume;
			controlBar.volume = mediaPlayer.volume;
		});

		// Change the playback rate when the rate controls are adjusted
		controlBar.addEventListener("ratechange", function(event){
			try { event.stopPropagation(); } catch (e) {} // Firefox Compatibility
			mediaPlayer.playbackRate = event.detail.playbackRate;
			controlBar.playbackRate = mediaPlayer.playbackRate;
		});

		// Mute/unmute the media when the mute button is pressed
		controlBar.addEventListener("mute", function(){
			try { event.stopPropagation(); } catch (e) {} // Firefox Compatibility
			mediaPlayer.muted = true;
			controlBar.muted = mediaPlayer.muted;
		});
		controlBar.addEventListener("unmute", function(){
			try { event.stopPropagation(); } catch (e) {} // Firefox Compatibility
			mediaPlayer.muted = false;
			controlBar.muted = mediaPlayer.muted;
		});

		// Enable/disable caption tracks when clicked in the caption menu
		controlBar.addEventListener("enabletrack", function(event){
			event.detail.track.mode = "showing";
			that.captionRenderer.rebuildCaptions();
		});
		controlBar.addEventListener("disabletrack", function(event){
			event.detail.track.mode = "disabled";
			that.captionRenderer.rebuildCaptions();
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
			}else{
				mediaPlayer.exitFullScreen();
				controlBar.fullScreen = false;
			}
		},false);

		//Enter/exit full screen when the button is pressed
		controlBar.addEventListener("enterfullscreen", function(){
			Ayamel.utils.FullScreen.enter(element);
		});

		controlBar.addEventListener("exitfullscreen", function(){
			Ayamel.utils.FullScreen.exit();
		});

		controlBar.addEventListener("captionJump", function(event){
			// Find the first visible track
			var track = that.captionRenderer.tracks.filter(function(track){return track.mode === "showing";})[0];
			if (track) {
				// Move forward or back a caption
				var traversal = Ayamel.utils.CaptionsTranversal[event.detail.direction];
				that.currentTime = traversal(track, that.currentTime);
			}
		});

		/*
		 * ==========================================================================================
		 *                                      Attributes
		 * ==========================================================================================
		 */

		Object.defineProperties(this, {
			duration: {
				get: function(){
					return mediaPlayer.duration;
				}
			},
			currentTime: {
				get: function(){
					return mediaPlayer.currentTime;
				},
				set: function(time){
					return mediaPlayer.currentTime = time;
				}
			},
			muted: {
				get: function(){
					return mediaPlayer.muted;
				},
				set: function(muted){
					return mediaPlayer.muted = muted;
				}
			},
			paused: {
				get: function(){
					return mediaPlayer.paused;
				}
			},
			playbackRate: {
				get: function(){
					return mediaPlayer.playbackRate;
				},
				set: function(playbackRate){
					return mediaPlayer.playbackRate = playbackRate;
				}
			},
			readyState: {
				get: function(){
					return mediaPlayer.readyState;
				}
			},
			volume: {
				get: function(){
					return mediaPlayer.volume;
				},
				set: function (volume) {
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

		// Resize until it fills the most space avaliable
		do {
			resizeWidth = this.width;
			this.resetSize();
		} while (this.width != resizeWidth);
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
		if (this.controlBar.components.captions) {
			this.controlBar.components.captions.addTrack(track);
		}
	};

	AyamelPlayer.prototype.removeTextTrack = function(track){
		if(!this.captionRenderer){ return; }
		if(this.captionRenderer.tracks.indexOf(track) === -1){ return; }
		this.captionRenderer.removeTextTrack(track);
		if (this.controlBar.components.captions) {
			this.controlBar.components.captions.rebuild(this.captionRenderer.tracks);
		}
	};

	AyamelPlayer.prototype.refreshCaptionMenu = function(){
		if(!this.captionRenderer){ return; }
		if (!this.controlBar.components.captions){ return; }
		this.controlBar.components.captions.rebuild(this.captionRenderer.tracks);
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
		Ayamel.utils.fitAspectRatio(this.element, this.aspectRatio, this.maxWidth, this.maxHeight);
		this.mediaPlayer.height = this.element.offsetHeight;
	};

	Ayamel.classes.AyamelPlayer = AyamelPlayer;
}(Ayamel));