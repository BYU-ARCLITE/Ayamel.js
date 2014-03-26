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
        for(i = 0; pluginModule = registeredPlugins[pluginPriority[i]]; i++){
            if (pluginModule.supports(resource)) {
				return [pluginModule.install(args), pluginModule.features];
			}
        }
        return null;
	}
		


    function MediaPlayer(args) {
        var _this = this,
			plugin, pluginData, $element;

		if(!Ayamel.utils.hasTimeline(args.resource)){
			throw new Error("Cannot create player for untimed media.");
		}
		
		// Attempt to load the resource
		$element = $(template);
        args.$holder.append($element);
        pluginData = loadPlugin({
			$holder: $element,
			resource: args.resource,
			aspectRatio: args.aspectRatio,
			startTime: args.startTime,
			endTime: args.endTime
		});

		if(pluginData === null){
			$element.remove();
			throw new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser");
		}		
		
        plugin = pluginData[0];
		
        this.$element = $element;
        this.element = $element[0];

        this.plugin = plugin;
        this.$captionsElement = plugin.$captionsElement;
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

        args.featureCallback && args.featureCallback(pluginData[1]);
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
			plugin, pluginData, $element;

		if(Ayamel.utils.hasTimeline(args.resource)){
			throw new Error("Cannot create viewer for timed media.");
		}
	
		// Attempt to load the resource
		$element = $(template);
        args.$holder.append($element);
        pluginData = loadPlugin({
			$holder: $element,
			resource: args.resource,
			aspectRatio: args.aspectRatio
		});
        plugin = pluginData[0];
		if(plugin === null){
			$element.remove();
			throw new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser");
		}
		
        this.$element = $element;
        this.element = $element[0];

        this.plugin = plugin;
        this.$captionsElement = plugin.$captionsElement;
        this.captionsElement = plugin.captionsElement;

        args.featureCallback && args.featureCallback(pluginData[1]);
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