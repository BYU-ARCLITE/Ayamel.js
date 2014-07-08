(function(Ayamel) {
	"use strict";

	var template = '<div class="mediaPlayer"></div>',
	    BasicMediaPrototype = {
			enterFullScreen: function(availableHeight) {
				if (this.plugin) {
					this.plugin.enterFullScreen(availableHeight);
				}
			},
			exitFullScreen: function() {
				if (this.plugin) {
					this.plugin.exitFullScreen();
				}
			},
			addEventListener: function(event, callback) {
				this.element.addEventListener(event, callback, false);
			},
			removeEventListener: function(event, callback) {
				this.element.removeEventListener(event, callback, false);
			},
			get readyState () {
				return this.plugin.readyState;
			}
		};

	function loadPlugin(args){
		var pluginModule, i,
			pluginPlayer = null,
			resource = args.resource,
			registeredPlugins = Ayamel.mediaPlugins[resource.type] || {},
			pluginPriority = Ayamel.prioritizedPlugins[resource.type] || [];

		if (!pluginPriority.length) {
			pluginPriority = Object.keys(registeredPlugins);
		} else {
			pluginPriority = pluginPriority.filter(function(name){
				return registeredPlugins.hasOwnProperty(name);
			});
			[].push.apply(pluginPriority,Object.keys(registeredPlugins).filter(function(name){
				return pluginPriority.indexOf(name) === -1;
			}));
		}
		for(i = 0; i < pluginPriority.length && pluginPlayer == null; i++){
			pluginModule = registeredPlugins[pluginPriority[i]];
			if (pluginModule.supports(resource)) {
				pluginPlayer = pluginModule.install(args);
			}
		}
		return pluginPlayer;
	}


	function MediaPlayer(args) {
		var _this = this,
			plugin, element;

		if(!Ayamel.utils.hasTimeline(args.resource)){
			throw new Error("Cannot create player for untimed media.");
		}

		// Attempt to load the resource
		element = Ayamel.utils.parseHTML(template);

		//needs to be in the document before loading a plugin
		//so the plugin can examine the displayed size
		args.holder.appendChild(element);
		plugin = loadPlugin({
			holder: element,
			resource: args.resource,
			aspectRatio: args.aspectRatio,
			startTime: args.startTime,
			endTime: args.endTime
		});

		if(plugin === null){
			throw new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser");
		}		

		this.element = element;
		this.plugin = plugin;
		this.captionsElement = plugin.captionsElement;

		Object.defineProperties(this, {
			duration: {
				get: function () {
					return plugin.duration;
				}
			},
			currentTime: {
				get: function () {
					return plugin.currentTime;
				},
				set: function (time) {
					return plugin.currentTime = time;
				}
			},
			muted: {
				get: function () {
					return plugin.muted;
				},
				set: function (muted) {
					return plugin.muted = muted;
				}
			},
			paused: {
				get: function () {
					return plugin.paused;
				}
			},
			playbackRate: {
				get: function () {
					return plugin.playbackRate;
				},
				set: function (playbackRate) {
					return plugin.playbackRate = playbackRate;
				}
			},
			volume: {
				get: function () {
					return plugin.volume;
				},
				set: function (volume) {
					return plugin.volume = volume;
				}
			}
		});

		args.featureCallback && args.featureCallback(plugin.features);
	}

	MediaPlayer.prototype = Object.create(BasicMediaPrototype,{
		paused: {
			get: function () {
				return this.plugin.paused;
			}
		},
		duration: {
			get: function () {
				return this.plugin.duration;
			}
		},
		play: {
			value: function () {
				this.plugin.play();
			}
		},
		pause: {
			value: function () {
				this.plugin.pause();
			}
		}
	});

	function MediaViewer(args) {
		var _this = this,
			plugin, element;

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

		args.featureCallback && args.featureCallback(plugin.features);
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