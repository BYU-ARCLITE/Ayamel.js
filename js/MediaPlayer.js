(function(Ayamel) {
	"use strict";

	var template = '<div class="mediaPlayer"></div>',
		BasicMediaPrototype = {
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
			get readyState(){ return this.plugin.readyState; },
			get height(){ return this.plugin.height; },
			set height(h){ return this.plugin.height = h; },
			get width(){ return this.plugin.width; },
			set width(w){ return this.plugin.width = w; }
		};

	function loadPlugin(args){
		var pluginModule, len, i,
			pluginPlayer = null,
			resource = args.resource,
			type = resource.type,
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
			if(pluginModule.supports(resource)){
				pluginPlayer = pluginModule.install(args);
				if(pluginPlayer !== null){ return pluginPlayer; }
			}
		}
		return null;
	}

	//Checks to see if a language has been set in HTML
	function findCurrentLanguage(node,def){
		while(node && node.nodeType !== Node.ELEMENT_NODE){
			node = node.parentNode;
		}
		do {
			if(node.hasAttribute('lang')){
				return node.getAttribute('lang');
			}
			node = node.parentNode;
		}while(node && !node.classList.contains("caption-cue"));
		return def;
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
					srcLang: findCurrentLanguage(
						detail.range.startContainer,
						cue.track.language
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

			captionsElement = Ayamel.utils.parseHTML('<div class="videoCaptionHolder"></div>');
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

	function MediaPlayer(args){
		var that = this,
			resource = args.resource,
			startTime = args.startTime,
			endTime = args.endTime,
			translator = args.translator,
			plugin, element, indexMap;

		// Attempt to load the resource
		element = Ayamel.utils.parseHTML(template);
		this.element = element;

		this.plugin = null;
		this.annotator = null;
		this.captionsElement = null;
		this.captionRenderer = null;

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
		element = Ayamel.utils.parseHTML(template);
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