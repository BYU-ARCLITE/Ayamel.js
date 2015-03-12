(function(Ayamel) {
	"use strict";

	var template = '<div class="mediaPlayer"></div>',
		BasicMediaPrototype = {
			supports: function(feature){
				if(!this.plugin){ return false; }
				var device = Ayamel.utils.mobile.isMobile ? "mobile" : "desktop";
				return !!this.plugin.features[device][feature];
			},
			enterFullScreen: function(availableHeight) {
				if(this.plugin){
					this.plugin.enterFullScreen(availableHeight);
				}
			},
			exitFullScreen: function() {
				if(this.plugin){
					this.plugin.exitFullScreen();
				}
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

	function MediaPlayer(args){
		var startTime = args.startTime,
			endTime = args.endTime,
			plugin, element;

		// Attempt to load the resource
		element = Ayamel.utils.parseHTML(template);

		//needs to be in the document before loading a plugin
		//so the plugin can examine the displayed size
		args.holder.appendChild(element);
		plugin = loadPlugin({
			holder: element,
			resource: args.resource,
			startTime: startTime,
			endTime: endTime
		});

		if(plugin === null){
			args.holder.removeChild(element);
			throw new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser");
		}		

		this.element = element;
		this.captionsElement = null;
		this.plugin = plugin;
		if(this.supports('captions')){
			this.captionsElement = Ayamel.utils.parseHTML('<div class="videoCaptionHolder"></div>');
			element.appendChild(this.captionsElement);
		}

		Object.defineProperties(this, {
			duration: {
				get: function(){ return endTime === -1 ? plugin.duration : (endTime - startTime); }
			},
			currentTime: {
				get: function(){ return plugin.currentTime - startTime; },
				set: function(time){ return plugin.currentTime = time + startTime; }
			},
			muted: {
				get: function(){ return plugin.muted; },
				set: function(muted){ return plugin.muted = muted; }
			},
			paused: {
				get: function(){ return plugin.paused; }
			},
			playbackRate: {
				get: function(){ return plugin.playbackRate; },
				set: function(playbackRate){
					return plugin.playbackRate = playbackRate;
				}
			},
			volume: {
				get: function(){ return plugin.volume; },
				set: function(volume){ return plugin.volume = volume; }
			}
		});

	}

	MediaPlayer.prototype = Object.create(BasicMediaPrototype,{
		paused: {
			get: function(){ return this.plugin.paused; }
		},
		duration: {
			get: function (){ return this.plugin.duration; }
		},
		play: {
			value: function(){ this.plugin.play(); }
		},
		pause: {
			value: function(){ this.plugin.pause(); }
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