(function (Ayamel, global) {
    "use strict";

    var template = '<div><div id="youtubePlayer"></div></div>';
    var captionHolderTemplate = '<div class="videoCaptionHolder"></div>';

    function supportsFile(file) {
        return file.streamUri &&
            (file.streamUri.substr(0, 10) === "youtube://"
            || file.streamUri.substr(0, 31) === "http://www.youtube.com/watch?v="
            || file.streamUri.substr(0, 16) === "http://youtu.be/");
    }

    function getYouTubeId(url) {
        if (url.substr(0, 10) === "youtube://") {
            return url.substr(10);
        } else if (url.substr(0, 31) === "http://www.youtube.com/watch?v=") {
            return url.substr(31);
        } else if (url.substr(0, 16) === "http://youtu.be/") {
            return url.substr(16);
        }
        return "";
    }

    function findFile(resource) {
        for (var i=0; i<resource.content.files.length; i += 1) {
            var file = resource.content.files[i];
            if (supportsFile(file))
                return file;
        }
        return null;
    }

    function YouTubePlayer(args) {
        var _this = this;

        // Create the element
        this.$element = $(template);
        args.$holder.append(this.$element);

        // Create a place for captions
        this.$captionsElement = $(captionHolderTemplate);
        args.$holder.append(this.$captionsElement);

        // Set up the aspect ratio
        args.aspectRatio = args.aspectRatio || Ayamel.aspectRatios.hdVideo;
        var width = _this.$element.width();
        var height = width / args.aspectRatio;
        _this.$element.height(height);

        // Include the YouTube API for a chromeless player
        // Docs here: https://developers.google.com/youtube/js_api_reference
        swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&version=3",
            "youtubePlayer", width, height, "8", null, null,
            { allowScriptAccess: "always", wmode: "transparent" }, { id: "myytplayer" });

        // Figure out the start and end time
        var startTime = args.startTime || 0;
        var endTime = args.endTime === -1 ? undefined : args.endTime;

        Object.defineProperties(this, {
            init: {
                value: function() {
                    this.$video = this.$element.children("#myytplayer")
                        .width("100%")
                        .height("100%");

                    // Load the source
                    this.$video[0].loadVideoById({
                        videoId: getYouTubeId(findFile(args.resource).streamUri),
                        startSeconds: startTime,
                        endSeconds: endTime,
                        suggestedQuality: "large"
                    });
                    this.$video[0].pauseVideo();

                    // Set up events. Unfortunately the YouTube API requires the callback to be in the global namespace.
                    window.youtubeStateChange = function(data) {
                        var stateEventMap = {
                            0: "ended",
                            1: "play",
                            2: "pause",
                            3: "durationchange"
                        };
                        var event = document.createEvent("HTMLEvents");
                        event.initEvent(stateEventMap[data], true, true);
                        _this.$element[0].dispatchEvent(event);

                        // If we started playing then send out timeupdate events
                        var playing = false;
                        function timeUpdate() {
                            var timeEvent = document.createEvent("HTMLEvents");
                            timeEvent.initEvent("timeupdate", true, true);
                            _this.$element[0].dispatchEvent(timeEvent);

                            if (playing) {
                                setTimeout(function () {timeUpdate();}, 50);
                            }
                        }
                        if (data === 1) {
                            playing = true;
                            timeUpdate();

                            // Send another durationchange event. It's always changing
                            var durationEvent = document.createEvent("HTMLEvents");
                            durationEvent.initEvent("durationchange", true, true);
                            _this.$element[0].dispatchEvent(durationEvent);
                        }
                        if (data === 0 || data === 2) {
                            playing = false;
                        }
                    };
                    this.$video[0].addEventListener("onStateChange", "youtubeStateChange");
                }
            },
            duration: {
                get: function () {
                    var end = endTime ? endTime : this.$video[0].getDuration();
                    return end - startTime;
                }
            },
            currentTime: {
                get: function () {
                    return this.$video[0].getCurrentTime() - startTime;
                },
                set: function (time) {
                    time = Math.floor(Number(time)* 100) / 100;
                    this.$video[0].seekTo(time);
                }
            },
            muted: {
                get: function () {
                    return this.$video[0].isMuted();
                },
                set: function (muted) {
                    if (!!muted) {
                        this.$video[0].mute();
                    } else {
                        this.$video[0].unMute();
                    }
                }
            },
            paused: {
                get: function () {
                    var state = this.$video[0].getPlayerState();
                    return state !== 1;
                }
            },
            playbackRate: {
                get: function () {
                    return this.$video[0].getPlaybackRate();
                },
                set: function (playbackRate) {
                    this.$video[0].setPlaybackRate(playbackRate);
                }
            },
            readyState: {
                get: function () {
                    return this.$video[0].getPlayerState();
                }
            },
            volume: {
                get: function () {
                    return this.$video[0].getVolume() / 100;
                },
                set: function (volume) {
                    this.$video[0].setVolume(Number(volume) * 100);
                }
            }
        });
    }

    YouTubePlayer.prototype.play = function() {
        this.$video[0].playVideo();
    };

    YouTubePlayer.prototype.pause = function() {
        this.$video[0].pauseVideo();
    };

    YouTubePlayer.prototype.enterFullScreen = function(availableHeight) {
        this.normalHeight = this.$element.height();
        this.$element.height(availableHeight);
    };

    YouTubePlayer.prototype.exitFullScreen = function() {
        this.$element.height(this.normalHeight);
    };

    Ayamel.mediaPlugins.youtube = {
        install: function(args) {
            var player;
            global.onYouTubePlayerReady = function() {
                player.init();
            };
            player = new YouTubePlayer(args);

            return player;
        },
        supports: function(resource) {
            return resource.content.files.reduce(function (prev, file) {
                return prev || (resource.type === "video" && supportsFile(file));
            }, false);
        }
    };
}(Ayamel, window));