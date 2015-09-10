(function(Ayamel) {
	"use strict";

	var features = {
		captions: function(player, pluginSupport){
			return pluginSupport;
		},
		annotations: function(player, pluginSupport){
			return pluginSupport;
		},
		fullScreen: function(player, pluginSupport){
			return pluginSupport;
		},
		lastCaption: function(player, pluginSupport){
			return pluginSupport;
		},
		play: function(player, pluginSupport){
			return pluginSupport || player.duration > 0;
		},
		seek: function(player, pluginSupport){
			return pluginSupport;
		},
		rate: function(player, pluginSupport){
			return pluginSupport;
		},
		timeCode: function(player, pluginSupport){
			return pluginSupport || player.duration > 0;
		},
		volume: function(player, pluginSupport){
			return pluginSupport;
		}
	};

	function pluginLoop(i,len,plugins,args){
		var module;
		for(;i < len; i++){
			module = plugins[i];
			if(!module.supports(args)){ continue; }
			//Promise.resolve allows install to return either a plugin,
			//or a promise for a plugin
			return Promise.resolve(module.install(args)).then(null,function(){
				return pluginLoop(i+1,len,plugins,args);
			});
		}
		return Promise.reject(new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser"));
	}

	function loadPlugin(args){
		var pluginModule,
			type = args.resource.type,
			registeredPlugins = Ayamel.mediaPlugins[type] || {},
			pluginPriority = Ayamel.prioritizedPlugins[type] || [],
			prioritizedPlugins;

		if(!pluginPriority.length){ //Use an arbitrary order when none is specified
			pluginPriority = Object.keys(registeredPlugins);
		}else{
			//Check prioritized plugins first
			pluginPriority = pluginPriority.filter(function(name){
				return registeredPlugins.hasOwnProperty(name);
			});
			//Then check any left-overs in arbitrary order
			[].push.apply(pluginPriority,Object.keys(registeredPlugins).filter(function(name){
				return pluginPriority.indexOf(name) === -1;
			}));
		}

		//Convert plugin names to plugin objects, and add fallback to the end of the priority list
		prioritizedPlugins = pluginPriority.map(function(name){ return registeredPlugins[name]; });
		pluginModule = Ayamel.mediaPlugins.fallbacks[type];
		if(pluginModule){ prioritizedPlugins.push(pluginModule); }
		return pluginLoop(0,prioritizedPlugins.length,prioritizedPlugins,args);
	}

	function makeCueRenderer(translator, annotator, indexMap){
		return function(renderedCue, area){
			var cue = renderedCue.cue,
				txt = new Ayamel.Text({
					content: cue.getCueAsHTML(renderedCue.kind === 'subtitles'),
					processor: annotator?function(n){
						annotator.index = indexMap.get(cue);
						return annotator.HTML(n);
					}:null
				});

			renderedCue.node = txt.displayElement;
			if(!translator){ return; }

			// Attach the translator
			txt.addEventListener('selection',function(event){
				var detail = event.detail;
				translator.translate({
					//TODO: Check if range contains multiple languages
					srcLang: Ayamel.utils.findCurrentLanguage(
						detail.range.startContainer,
						cue.track.language,
						'caption-cue'
					),//destLang is left to default
					text: detail.fragment.textContent.trim(),
					data: {
						cue: cue,
						sourceType: "caption"
					}
				});
			},false);
		};
	}

	function loadCaptions(resource, config){
		var test = null;
		if(config.whitelist instanceof Array){
			test = function(relation){ return config.whitelist.indexOf(relation.subjectId) > -1; };
		}else if(config.blacklist instanceof Array){
			test = function(relation){ return config.blacklist.indexOf(relation.subjectId) === -1; };
		}
		return resource.getTranscripts(test).then(function(tlist){
			return Promise.all(tlist.map(function(transres){
				return Ayamel.utils.loadCaptionTrack(transres)
				.then(function(obj){
					return {track: obj.track, mime: obj.mime, resource: transres};
				},function(err){ return null; });
			})).then(function(objs){
				return objs.filter(function(obj){ return obj !== null; });
			});
		});
	}

	function setupCaptioning(player, translator, resource, args){
		var annotations = args.annotations,
			captions = args.captions,
			annotator, indexMap,
			captionsElement, captionRenderer;

		//TODO: Load annotations from subtitle resources,
		//and push this annotator down to the plugin level
		if(player.supports('annotations')){
			annotator = Ayamel.Annotator.loadFor(resource, {
				parsers: annotations.parsers,
				classList: annotations.classList,
				style: annotations.style,
				handler: function(data, lang, text, index){
					player.element.dispatchEvent(new CustomEvent("annotation", {
						bubbles: true,
						detail: {data: data, lang: lang, text: text, index: index}
					}));
				}
			});
			player.annotator = annotator;
			annotator.addEventListener('addannset', function(e){
				player.element.dispatchEvent(new CustomEvent('addannset', {
					bubbles:true, detail: {annset: e.detail}
				}));
			}, false);
			annotator.addEventListener('refresh', function(){
				player.rebuildCaptions(true);
			});
		}

		if(player.supports('captions')){
			indexMap = new Map();

			captionsElement = document.createElement('div');
			captionsElement.className = "videoCaptionHolder";
			player.element.appendChild(captionsElement);

			captionRenderer = new TimedText.CaptionRenderer({
				target: captionsElement,
				appendCueCanvasTo: captionsElement,
				renderCue: typeof captions.renderCue === "function" ?
							captions.renderCue : makeCueRenderer(translator, annotator, indexMap)
			});
			captionRenderer.bindMediaElement(player);

			player.captionsElement = captionsElement;
			player.captionRenderer = captionRenderer;

			loadCaptions(resource, args.captions).then(function(objs){
				var element = player.element;
				objs.forEach(function(obj){
					var offset = 0;
					if(captionRenderer.addTextTrack(obj.track) === null){ return; }
					obj.track.cues.forEach(function(cue){
						indexMap.set(cue, offset);
						offset += cue.getCueAsHTML().textContent.length;
					});
					element.dispatchEvent(new CustomEvent('addtexttrack', {
						bubbles:true, detail: obj
					}));
				});
			});
		}
	}

	function getDocumentSoundtracks(resource, config){
		var cmp = (config.whitelist instanceof Array)?function(id){
				return config.whitelist.indexOf(id) > -1;
			}:(config.blacklist instanceof Array)?function(id){
				return config.blacklist.indexOf(relation.objectId) === -1;
			}:function(){ return true; };
		return resource.loadResourcesFromRelations("objectId", function(relation){
			return relation.type === "transcript_of" && cmp(relation.objectId);
		}).then(function(rlist){
			return rlist.filter(function(res){
				return res.type === "video" || res.type === "audio";
			});
		});
	}

	function getVideoSoundtracks(resource, config){
		var cmp = (config.whitelist instanceof Array)?function(id){
				return config.whitelist.indexOf(id) > -1;
			}:(config.blacklist instanceof Array)?function(id){
				return config.blacklist.indexOf(relation.objectId) === -1;
			}:function(){ return true; };
		//TODO: should also check "translation_of" both ways, and "based_on"s related to those translations
		return resource.loadResourcesFromRelations("subjectId", function(relation){
			return relation.type === "based_on" && cmp(relation.subjectId);
		}).then(function(rlist){
			return rlist.filter(function(res){
				return res.type === "video" || res.type === "audio";
			});
		});
	}

	function getImageSoundtracks(resource, config){
		return Promise.resolve([]);
	}

	function setupSoundtracks(player, resource, args){
		var p, soundtracks = args.soundtracks,
			soundManager = new Ayamel.classes.SoundManager(player.plugin);

		player.soundManager.copyState(soundManager);
		player.soundManager = soundManager;

		switch(resource.type){
		case 'document': p = getDocumentSoundtracks(resource, args);
			break;
		case 'image': p = getImageSoundtracks(resource, args);
			break;
		case 'video':
			p = getVideoSoundtracks(resource, args);
			soundManager.addPlayer(player.plugin,true);
			break;
		case 'audio':
			soundManager.addPlayer(player.plugin,true);
			return Promise.resolve([]);
		default:
			return Promise.reject(new Error("Non-viewable resource type"));
		}

		return p.then(function(rlist){ //Turn resources into player plugins
			var plugins = rlist.map(function(res){
				return loadPlugin({resource: res});
			}).filter(function(p){ return p !== null; });
			if(!plugins.length){ return; } //bailout
			plugins.forEach(function(plugin){
				soundManager.addPlayer(plugin,false);
				player.element.dispatchEvent(new CustomEvent('addaudiotrack', {
					detail: {
						track: plugin,
						name: plugin.resource.title,
						active: false
					}, bubbles: true
				}));
			});
			if(resource.type === 'video'){
				player.element.dispatchEvent(new CustomEvent('addaudiotrack', {
					detail: {
						track: player.plugin,
						name: "Default",
						active: true
					}, bubbles: true
				}));
			}
		});
	}

	function MediaPlayer(args){
		var that = this,
			resource = args.resource,
			startTime = args.startTime,
			endTime = args.endTime,
			translator = args.translator,
			element, indexMap;

		// Attempt to load the resource
		element = document.createElement('div');
		element.className = "mediaPlayer";
		this.element = element;

		this.plugin = new PluginShell();
		this.soundManager = new SoundShell();
		
		this.annotator = null;
		this.captionsElement = null;
		this.captionRenderer = null;

		//needs to be in the document before loading a plugin
		//so the plugin can examine the displayed size
		args.holder.appendChild(element);
		this.promise = loadPlugin({
			holder: element,
			resource: resource,
			startTime: startTime,
			endTime: endTime,
			translator: translator,
			annotations: args.annotations
		}).then(function(plugin){
			that.plugin.copyState(plugin);
			that.plugin = plugin;
			setupCaptioning(that, translator, resource, args);
			return setupSoundtracks(that, resource, args)
				.then(function(){ return that; });
		},function(e){
			args.holder.removeChild(element);
			throw e;
		});

		Object.defineProperties(this, {
			duration: {
				get: function(){ return endTime === -1 ? this.plugin.duration : (endTime - startTime); }
			},
			currentTime: {
				get: function(){ return this.plugin.currentTime - startTime; },
				set: function(time){ return this.plugin.currentTime = time + startTime; }
			}
		});
	}

	MediaPlayer.prototype = {
		supports: function(feature){
			var device = Ayamel.utils.mobile.isMobile ? "mobile" : "desktop";
			if(features.hasOwnProperty(feature)){
				return features[feature](this, !!this.plugin.features[device][feature]);
			}
			return false;
		},
		addEventListener: function(event, callback, capture){
			this.element.addEventListener(event, callback, !!capture);
		},
		removeEventListener: function(event, callback, capture){
			this.element.removeEventListener(event, callback, !!capture);
		},
		removeAnnSet: function(annset){
			if(!this.annotator){ return; }
			this.annotator.removeSet(annset);
		},
		addAnnSet: function(annset){
			if(!this.annotator){ return; }
			this.annotator.addSet(annset);
		},
		removeTextTrack: function(track){
			if(!this.captionRenderer){ return; }
			if(this.captionRenderer.addTextTrack(track) === null){ return; }
			this.element.dispatchEvent(new CustomEvent('removetexttrack', {
				bubbles: true, detail: track
			}));
		},
		addTextTrack: function(track){
			if(!this.captionRenderer){ return; }
			if(this.captionRenderer.addTextTrack(track) === null){ return; }
			this.element.dispatchEvent(new CustomEvent('addtexttrack', {
				bubbles: true, detail: track
			}));
		},
		rebuildCaptions: function(force){
			if(!this.captionRenderer){ return; }
			this.captionRenderer.rebuildCaptions(!!force);
		},
		refreshLayout: function(force){
			if(!this.captionRenderer){ return; }
			this.captionRenderer.refreshLayout();
		},
		cueJump: function(dir){
			if(!this.captionRenderer){ return; }
			var tracks = this.captionRenderer.tracks.filter(function(track){
				return track.mode === "showing";
			});
			if(tracks.length){ // Move forward or back a caption
				this.currentTime = Ayamel.utils.CaptionsTranversal[
					dir === "forward"?"forward":"back"
				](tracks, this.currentTime);
			}
		},
		get textTracks(){
			return this.captionRenderer?this.captionRenderer.tracks:[];
		},
		destroy: function(){
			var el = this.element;
			this.plugin.pause();
			if(el.parentElement){ el.parentElement.removeChild(el); }
		},

		enterFullScreen: function(h,w){ this.plugin.enterFullScreen(h,w); },
		exitFullScreen: function(){ this.plugin.exitFullScreen(); },
		play: function(){ this.plugin.play(); },
		pause: function(){ this.plugin.pause(); },
		get paused(){ return this.plugin.paused; },
		get playbackRate(){ return this.plugin.playbackRate; },
		set playbackRate(rate){	return this.plugin.playbackRate = rate; },
		get readyState(){ return this.plugin.readyState; },
		get height(){ return this.plugin.height; },
		set height(h){ return this.plugin.height = h; },
		get width(){ return this.plugin.width; },
		set width(w){ return this.plugin.width = w; },

		enableAudio: function(track){ this.soundManager.activate(track); },
		disableAudio: function(track){ this.soundManager.deactivate(track); },
		get muted(){ return this.soundManager.muted; },
		set muted(muted){ return this.soundManager.muted = muted; },
		get volume(){ return this.soundManager.volume; },
		set volume(volume){ return this.soundManager.volume = volume; }
	};

	function SoundShell(){
		this.audioTracks = [];
		this.volume = 1;
		this.muted = false;
	}

	SoundShell.prototype = {
		enableAudio: function(track){
			if(this.audioTracks.indexOf(track) !== -1){ return; }
			this.audioTracks.push(track);
		},
		disableAudio: function(track){
			var idx = this.audioTracks.indexOf(track);
			if(idx !== -1){ this.audioTracks.splice(idx,1); }
		},
		copyState: function(sound){
			sound.volume = this.volume;
			sound.muted = this.muted;
			this.audioTracks.forEach(function(track){
				mplayer.soundManager.activate(track);
			});
		}
	};

	function PluginShell(){
		this.playbackRate = 1;
		this.paused = true;
		this.fsHeight = NaN;
		this.fsWidth = NaN;
		this.height = NaN;
		this.width = NaN;
	}

	PluginShell.prototype = {
		get readyState(){ return 0; },
		play: function(){ this.paused = false; },
		pause: function(){ this.paused = true; },
		enterFullScreen: function(h,w){
			this.fsHeight = h;
			this.fsWidth = w;
		},
		exitFullScreen: function(){
			this.fsHeight = NaN;
			this.fsWidth = NaN;
		},
		copyState: function(plugin){
			if(!isNaN(this.height)){ plugin.height = this.height; }
			if(!isNaN(this.width)){ plugin.width = this.width; }
			if(!isNaN(this.fsHeight)){ plugin.enterFullScreen(this.fsHeight,this.fsWidth); }

			plugin.playbackRate = this.playbackRate;
			if(!this.paused){ plugin.play(); }
		}
	};

	Ayamel.classes.MediaPlayer = MediaPlayer;
}(Ayamel));