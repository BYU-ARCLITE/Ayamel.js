(function(Ayamel) {
    "use strict";

    var template = '<div class="mediaPlayer"></div>';

    function createElement() {
        return $(template);
    }

    function MediaPlayer(args) {
        var _this = this;
        var playerRegistered = false;

        // Set up the element
        this.$element = createElement();
        args.$holder.append(this.$element);

        // Load the resource
        Ayamel.mediaPlugins.forEach(function (plugin) {
            if (!playerRegistered && plugin.supports(args.resource)) {
                playerRegistered = true;
                _this.plugin = plugin.install({
                    $holder: _this.$element,
                    resource: args.resource,
                    aspectRatio: args.aspectRatio
                });
            }
        });

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
                    return false;
                },
                set: function (time) {
                    if (this.plugin) {
                        this.plugin.currentTime = time;
                    }
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
                        this.plugin.muted = muted;
                    }
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
                        this.plugin.playbackRate = playbackRate;
                    }
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
                        this.plugin.volume = volume;
                    }
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
        this.$element[0].addEventListener(event, callback);
    };

    MediaPlayer.prototype.removeEventListener = function(event, callback) {
        this.$element[0].removeEventListener(event, callback);
    };

    Ayamel.classes.MediaPlayer = MediaPlayer;
}(Ayamel));