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
        var _this = this,
			plugins = Ayamel.prioritizedPlugins,
			$element = $(template);

        args.startTime = processTime(args.startTime || 0);
        args.endTime = processTime(args.endTime || -1);

        // Set up the element
        this.$element = $element;
        this.element = $element[0];
        args.$holder.append(this.$element);

        // Load the resource
        if(!plugins.length) {
            plugins = Object.keys(Ayamel.mediaPlugins).map(function(plugin) {
                return Ayamel.mediaPlugins[plugin];
            });
        }
		try {
			plugins.forEach(function (plugin) {
				if (plugin.supports(args.resource)) {
					_this.plugin = plugin.install({
						$holder: $element,
						resource: args.resource,
						aspectRatio: args.aspectRatio,
						startTime: args.startTime,
						endTime: args.endTime
					});
					throw 0;
				}
			});
		}catch(e){
			if(e !== 0){ throw e; }
		}

        // There needs to be a place for captions
        if (this.plugin) {
            this.$captionsElement = this.plugin.$captionsElement;
        }

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