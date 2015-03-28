(function(Ayamel) {
	"use strict";

	var BasicMediaPrototype = {
			supports: function(feature){
				if(!this.plugin){ return false; }
				var device = Ayamel.utils.mobile.isMobile ? "mobile" : "desktop";
				return !!this.plugin.features[device][feature];
			},
			enterFullScreen: function(availableHeight){
				this.plugin.enterFullScreen(availableHeight);
			},
			exitFullScreen: function(){
				this.plugin.exitFullScreen();
			},
			addEventListener: function(event, callback){
				this.element.addEventListener(event, callback, false);
			},
			removeEventListener: function(event, callback){
				this.element.removeEventListener(event, callback, false);
			},
			refreshAnnotations: function(){
				if(!this.annotator){ return; }
				this.annotator.refresh();
				if(this.captionRenderer){ this.captionRenderer.rebuildCaptions(true); }
			},
			removeAnnSet: function(annset){
				if(!this.annotator){ return; }
				var removed = this.annotator.removeSet(annset);
				if(removed && this.captionRenderer && annset.mode === "showing"){
					this.captionRenderer.rebuildCaptions(true);
				}
			},
			addAnnSet: function(annset){
				if(!this.annotator){ return; }
				var added = this.annotator.addSet(annset);
				if(added && this.captionRenderer && annset.mode === "showing"){
					this.captionRenderer.rebuildCaptions(true);
				}
			},
			removeTextTrack: function(track){
				if(!this.captionRenderer){ return; }
				if(this.captionRenderer.tracks.indexOf(track) === -1){ return; }
				this.captionRenderer.removeTextTrack(track);
			},
			addTextTrack: function(track){
				if(!this.captionRenderer){ return; }
				if(this.captionRenderer.tracks.indexOf(track) !== -1){ return; }
				this.captionRenderer.addTextTrack(track);
			},
			rebuildCaptions: function(){
				if(!this.captionRenderer){ return; }
				this.captionRenderer.rebuildCaptions();
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
			enableAudio: function(track){
				if(!this.soundManager){ return; }
				this.soundManager.activate(track);
			},
			disableAudio: function(track){
				if(!this.soundManager){ return; }
				this.soundManager.deactivate(track);
			},
			get readyState(){ return this.plugin.readyState; },
			get height(){ return this.plugin.height; },
			set height(h){ return this.plugin.height = h; },
			get width(){ return this.plugin.width; },
			set width(w){ return this.plugin.width = w; }
		};

	function loadPlugin(args){
		var pluginModule, len, i,
			pluginPlayer = null,
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
		len = prioritizedPlugins.length;

		for(i = 0; i < len; i++){
			pluginModule = prioritizedPlugins[i];
			if(pluginModule.supports(args)){
				pluginPlayer = pluginModule.install(args);
				if(pluginPlayer !== null){ return pluginPlayer; }
			}
		}
		return null;
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

	function loadAnnotations(resource, config){
		var test = null;
		if(config.whitelist instanceof Array){
			test = function(relation){ return config.whitelist.indexOf(relation.subjectId) > -1; };
		}else if(config.blacklist instanceof Array){
			test = function(relation){ return config.blacklist.indexOf(relation.subjectId) === -1; };
		}
		return resource.getAnnotations(test).then(function(rlist){
			return Promise.all(rlist.map(function(annres){
				return Ayamel.utils.HTTP({url: annres.content.files[0].downloadUri})
				.then(function(manifest){
					return new Ayamel.Annotator.AnnSet(
						resource.title,
						resource.languages.iso639_3[0],
						JSON.parse(manifest)
					);
				}).then(null,function(err){ return null; });
			}));
		}).then(function(list){
			return list.filter(function(m){ return m !== null; });
		});
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
				});
			}));
		});
	}

	function setupCaptioning(player, translator, resource, args){
		var annotations = args.annotations,
			captions = args.captions,
			annotator, indexMap,
			captionsElement, captionRenderer;

		if(player.supports('annotations')){
			annotator = new Ayamel.Annotator({
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
			//TODO: Load annotations from subtitle resources,
			//and push this annotator down to the plugin level
			loadAnnotations(resource, annotations).then(function(list){
				var element = player.element;
				annotator.annotations = list;
				list.forEach(function(annset){
					element.dispatchEvent(new CustomEvent('addannset', {
						bubbles:true, detail: {annset: annset}
					}));
				});
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
					captionRenderer.addTextTrack(obj.track);
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
		var p, soundtracks = args.soundtracks;
		if(typeof Ayamel.classes.SoundManager !== 'function'){ return; }
		switch(resource.type){
		case 'document': p = getDocumentSoundtracks(resource, args);
			break;
		case 'video': p = getVideoSoundtracks(resource, args);
			break;
		case 'image': p = getImageSoundtracks(resource, args);
			break;
		case 'audio': return;
		default:
			throw new Error("Non-viewable resource type");
		}
		p.then(function(rlist){ //Turn resources into player plugins
			var plugins = rlist.map(function(res){
				return loadPlugin({resource: res});
			}).filter(function(p){ return p !== null; });
			if(!plugins.length){ throw 0; } //bailout
			return plugins;
		}).then(function(plugins){
			//Create a Sound Manager with the primary player plugin as the master
			var soundManager = new Ayamel.classes.SoundManager(player.plugin);
			player.soundManager = soundManager;

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

			//A video has its own sound, so we need to include it in the manager
			if(resource.type === 'video'){
				soundManager.addPlayer(player.plugin,true);
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
			plugin, element, indexMap;

		// Attempt to load the resource
		element = document.createElement('div');
		element.className = "mediaPlayer";
		this.element = element;

		this.plugin = null;
		this.annotator = null;
		this.captionsElement = null;
		this.captionRenderer = null;
		this.soundManager = null;

		//needs to be in the document before loading a plugin
		//so the plugin can examine the displayed size
		args.holder.appendChild(element);
		plugin = loadPlugin({
			holder: element,
			resource: resource,
			startTime: startTime,
			endTime: endTime,
			translator: translator,
			annotations: args.annotations
		});

		if(plugin === null){
			args.holder.removeChild(element);
			throw new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser");
		}

		this.plugin = plugin;
		setupCaptioning(this, translator, resource, args);
		setupSoundtracks(this, resource, args);

		Object.defineProperties(this, {
			duration: {
				get: function(){ return endTime === -1 ? plugin.duration : (endTime - startTime); }
			},
			currentTime: {
				get: function(){ return plugin.currentTime - startTime; },
				set: function(time){ return plugin.currentTime = time + startTime; }
			}
		});

	}

	MediaPlayer.prototype = Object.create(BasicMediaPrototype,{
		paused: {
			get: function(){ return this.plugin.paused; }
		},
		play: {
			value: function(){ this.plugin.play(); }
		},
		pause: {
			value: function(){ this.plugin.pause(); }
		},
		playbackRate: {
			get: function(){ return this.plugin.playbackRate; },
			set: function(playbackRate){
				return this.plugin.playbackRate = playbackRate;
			}
		},
		muted: {
			get: function(){ return this.plugin.muted; },
			set: function(muted){ return this.plugin.muted = muted; }
		},
		volume: {
			get: function(){ return this.plugin.volume; },
			set: function(volume){ return this.plugin.volume = volume; }
		}
	});

	function MediaViewer(args) {
		var plugin, element;

		if(Ayamel.utils.hasTimeline(args.resource)){
			throw new Error("Cannot create viewer for timed media.");
		}

		// Attempt to load the resource
		element = document.createElement('div');
		element.className = "mediaPlayer";
		plugin = loadPlugin({
			holder: element,
			resource: args.resource,
			aspectRatio: args.aspectRatio
		});

		if(plugin === null){
			throw new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser");
		}

		args.holder.appendChild(element);

		this.element = element;

		this.plugin = plugin;
		this.captionsElement = plugin.captionsElement;
	}

	MediaViewer.prototype = BasicMediaPrototype;

	function createMedia(args) {
		var resource = args.resource;
		if(Ayamel.utils.hasTimeline(args.resource)){
			return new MediaPlayer(args);
		}else{
			return new MediaViewer(args);
		}
	}

	Ayamel.utils.createMedia = createMedia;
	Ayamel.classes.MediaPlayer = MediaPlayer;
	Ayamel.classes.MediaViewer = MediaViewer;
}(Ayamel));