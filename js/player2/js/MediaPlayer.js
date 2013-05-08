(function(Ayamel) {
    "use strict";

    var template = '<div class="mediaPlayer"></div>';

    function processTime(time) {
        try {
            if (typeof time === "number")
                return time;
            var parts = time.split(":");
            if (parts.length === 3)
                return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[0]);
            if (parts.length === 2)
                return Number(parts[0] * 60) + Number(parts[1]);
            if (parts.length === 1)
                return Number(parts[0]);
        } catch (e) {
            console.log(e);
        }
        return 0;
    }

    function MediaPlayer(args) {
        var _this = this, i,
			pluginModule, plugin = null,
			resource = args.resource,
			registeredPlugins = Ayamel.mediaPlugins[resource.type] || {},
			pluginPriority = Ayamel.prioritizedPlugins[resource.type] || [],
			$element = $(template),
			startTime = processTime(args.startTime || 0),
			endTime = processTime(args.endTime || -1);

        // Set up the element
        this.$element = $element;
        this.element = $element[0];
        args.$holder.append(this.$element);

        // Load the resource
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
		for(i = 0; plugin === null && (pluginModule = registeredPlugins[pluginPriority[i]]); i++){
			if (!pluginModule.supports(args.resource)) { continue; }
			plugin = pluginModule.install({
				$holder: $element,
				resource: resource,
				aspectRatio: args.aspectRatio,
				startTime: startTime,
				endTime: endTime
			});
		}

        // There needs to be a place for captions
        if (plugin === null) {
			throw new Error("Could Not Find Resource Representation Compatible With Your Machine & Browser");
		}
		
		this.plugin = plugin;
        this.$captionsElement = plugin.$captionsElement;
		this.captionsElement = plugin.captionsElement;

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    if (this.plugin) {
                        return this.plugin.duration;
                    }
                    return 0;
                }
            },
            currentTime: {
                get: function () {
                    if (this.plugin) {
                        return this.plugin.currentTime;
                    }
                    return 0;
                },
                set: function (time) {
                    if (this.plugin) {
                        return this.plugin.currentTime = time;
                    }
					return 0;
                }
            },
            muted: {
                get: function () {
                    if (this.plugin) {
                        return this.plugin.muted;
                    }
                    return false;
                },
                set: function (muted) {
                    if (this.plugin) {
                        return this.plugin.muted = muted;
                    }
					return false;
                }
            },
            paused: {
                get: function () {
                    if (this.plugin) {
                        return this.plugin.paused;
                    }
                    return true;
                }
            },
            playbackRate: {
                get: function () {
                    if (this.plugin) {
                        return this.plugin.playbackRate;
                    }
                    return 1;
                },
                set: function (playbackRate) {
                    if (this.plugin) {
                        return this.plugin.playbackRate = playbackRate;
                    }
					return 1;
                }
            },
            readyState: {
                get: function () {
                    if (this.plugin) {
                        return this.plugin.readyState;
                    }
                    return 0;
                }
            },
            volume: {
                get: function () {
                    if (this.plugin) {
                        return this.plugin.volume;
                    }
                    return 1;
                },
                set: function (volume) {
                    if (this.plugin) {
                        return this.plugin.volume = volume;
                    }
					return 1;
                }
            }
        });
    }

    MediaPlayer.prototype.play = function() {
        if (this.plugin) {
            this.plugin.play();
        }
    };

    MediaPlayer.prototype.pause = function() {
        if (this.plugin) {
            this.plugin.pause();
        }
    };

    MediaPlayer.prototype.enterFullScreen = function(availableHeight) {
        if (this.plugin) {
            this.plugin.enterFullScreen(availableHeight);
        }
    };

    MediaPlayer.prototype.exitFullScreen = function() {
        if (this.plugin) {
            this.plugin.exitFullScreen();
        }
    };

    MediaPlayer.prototype.addEventListener = function(event, callback) {
        this.element.addEventListener(event, callback, false);
    };

    MediaPlayer.prototype.removeEventListener = function(event, callback) {
        this.element.removeEventListener(event, callback, false);
    };

    Ayamel.classes.MediaPlayer = MediaPlayer;
}(Ayamel));