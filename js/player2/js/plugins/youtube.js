(function (Ayamel, global) {
    "use strict";

    var template = '<div><div id="youtubePlayer"></div></div>',
        captionHolderTemplate = '<div class="videoCaptionHolder"></div>',
        counter = 0;

    function genId(){
        counter++;
        return "AyamelYTPlayer-"+counter.toString(36);
    }

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
        var file, i;
        for (i=0; i<resource.content.files.length; i += 1) {
            file = resource.content.files[i];
            if (supportsFile(file))
                return file;
        }
        return null;
    }

    function YouTubePlayer(args) {
        var _this = this,
            height, width,
            idstr = genId(),
            startTime = +args.startTime || 0,
            stopTime = +args.endTime || -1,
            $element = $(template),
            element = $element[0],
            $captionsElement = $(captionHolderTemplate),
            captionsElement = $captionsElement[0];

        // Create the element
        this.$element = $element;
        this.element = element;
        args.$holder.append(this.$element);

        this.video = null;

        // Create a place for captions
        this.$captionsElement = $captionsElement;
        this.captionsElement = captionsElement;
        args.$holder.append($captionsElement);

        // Set up the aspect ratio
        //TODO: check for height overflow and resize smaller if necessary
        args.aspectRatio = args.aspectRatio || Ayamel.aspectRatios.hdVideo;
        width = $element.width();
        height = width / args.aspectRatio;
        $element.height(height);

        // Include the YouTube API for a chromeless player
        // Docs here: https://developers.google.com/youtube/js_api_reference
        swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&version=3",
            "youtubePlayer", width, height, "8", null, null,
            { allowScriptAccess: "always", wmode: "transparent" }, { id: idstr });

		//TODO: Set up properties object to allow interactions before YouTube has loaded
			
        Object.defineProperties(this, {
			init: {
                value: function() {
                    var $video = this.$element.children("#"+idstr),
						video = $video[0],
						playing = false;
						
                    $video.width("100%").height("100%");

					this.video = video;
					
                    // Load the source
                    video.loadVideoById({
                        videoId: getYouTubeId(findFile(args.resource).streamUri),
                        startSeconds: startTime,
                        endSeconds: stopTime === -1 ? undefined : stopTime,
                        suggestedQuality: "large"
                    });
                    video.pauseVideo();

                    // Set up events. Unfortunately the YouTube API requires the callback to be in the global namespace.
                    window.youtubeStateChange = function(data) {
                        var event;
						if(data === -1) { return; }
						
						event = document.createEvent("HTMLEvents");	
                        event.initEvent({
							0: "ended",
							1: "play",
							2: "pause",
							3: "durationchange",
							5: 'loading'
						}[data], true, true);
                        element.dispatchEvent(event);

                        // If we started playing then send out timeupdate events
                        if (data === 1) {
                            playing = true;
                            (function timeUpdate() {
                                var timeEvent = document.createEvent("HTMLEvents");
                                timeEvent.initEvent("timeupdate", true, true);
                                element.dispatchEvent(timeEvent);

                                if (!playing) { return; }
                                if(Ayamel.utils.Animation){
                                    Ayamel.utils.Animation.requestFrame(timeUpdate);
                                }else{
                                    setTimeout(timeUpdate, 50);
                                }
                            }());
                        }else if(data === 0 || data === 2){
							playing = false;
						}
                    };
                    video.addEventListener("onStateChange", "youtubeStateChange");
                }
            },
            duration: {
                get: function () {
                    var stop = stopTime === -1 ? this.video.getDuration() : stopTime;
                    return stop - startTime;
                }
            },
            currentTime: {
                get: function () {
                    return this.video.getCurrentTime() - startTime;
                },
                set: function (time) {
                    time = Math.floor((+time||0)* 100) / 100;
                    this.video.seekTo(time);
                    return time;
                }
            },
            muted: {
                get: function () {
                    return this.video.isMuted();
                },
                set: function (muted) {
                    muted = !!muted;
                    this.video[muted?'mute':'unmute']();
                    return muted;
                }
            },
            paused: {
                get: function () {
                    return this.video.getPlayerState() !== 1;
                }
            },
            playbackRate: {
                get: function () {
                    return this.video.getPlaybackRate();
                },
                set: function (playbackRate) {
                    playbackRate = +playbackRate
                    if(isNaN(playbackRate)){ playbackRate = 1; }
                    this.video.setPlaybackRate(playbackRate);
                    return playbackRate;
                }
            },
            readyState: {
                get: function () {
                    return this.video.getPlayerState();
                }
            },
            volume: {
                get: function () {
                    return this.video.getVolume() / 100;
                },
                set: function (volume) {
                    volume = (+volume||0);
                    this.video.setVolume(volume * 100);
                    return volume;
                }
            }
        });
    }

    YouTubePlayer.prototype.play = function() {
        this.video.playVideo();
    };

    YouTubePlayer.prototype.pause = function() {
        this.video.pauseVideo();
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
            var player = new YouTubePlayer(args);
            global.onYouTubePlayerReady = player.init.bind(player);
            return player;
        },
        supports: function(resource) {
            return resource.content.files.some(function (file) {
                return (resource.type === "video" && supportsFile(file));
            });
        }
    };
}(Ayamel, window));