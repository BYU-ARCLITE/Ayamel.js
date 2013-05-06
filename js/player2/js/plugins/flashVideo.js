/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/6/13
 * Time: 8:34 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {

    var template = "<div class='videoBox'><div id='flowplayerHolder'></div></div>";
    var captionHolderTemplate = '<div class="videoCaptionHolder"></div>';

    var supportedMimeTypes = [
        "video/mp4",
        "video/x-flv"
    ];

    function supportsFile(file) {
        var mime = file.mime.split(";")[0];
        return supportedMimeTypes.indexOf(mime) >= 0;
    }

    function findFile(resource) {
        for (var i=0; i<resource.content.files.length; i += 1) {
            var file = resource.content.files[i];
            if (supportsFile(file))
                return file;
        }
        return null;
    }

    function FlashVideoPlayer(args) {
        var _this = this;
        var playing = false;
        var swfPath = Ayamel.path + "js/plugins/flowplayer/flowplayer-3.2.16.swf";
        var width;

        // Create the element
        this.$element = $(template);
        args.$holder.append(this.$element);

        // Create a place for captions
        this.$captionsElement = $(captionHolderTemplate);
        args.$holder.append(this.$captionsElement);

        // Set up the aspect ratio
        args.aspectRatio = args.aspectRatio || Ayamel.aspectRatios.hdVideo;
        width = _this.$element.width();
        var height = width / args.aspectRatio;
        _this.$element.height(height);

        // Create the player
        this.player = flowplayer("flowplayerHolder", {
            src: swfPath,
            wmode: "transparent"
        }, {
            wmode: "opaque",

            canvas: {
                backgroundColor: "#000000",
                backgroundGradient: "none"
            },

            clip: {
                url: findFile(args.resource).downloadUri,
                autoPlay: false,
                autoBuffering: true,
                scaling: "fit",

                // Set up clip events
                onFinish: function() {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("ended", true, true);
                    _this.$element[0].dispatchEvent(event);
                    playing = false;
                },
                onMetaData: function() {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("durationchange", true, true);
                    _this.$element[0].dispatchEvent(event);
                },
                onPause: function() {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("pause", true, true);
                    _this.$element[0].dispatchEvent(event);
                    playing = false;
                },
                onResume: function() {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("play", true, true);
                    _this.$element[0].dispatchEvent(event);
                    playing = true;
                },
                onStart: function() {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("play", true, true);
                    _this.$element[0].dispatchEvent(event);
                    playing = true;
                },
                onStop: function() {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("pause", true, true);
                    _this.$element[0].dispatchEvent(event);
                    playing = false;
                }
            },

            play: null,

            plugins: {
                controls: null
            }
        });

        // Set up duration
        var startTime = args.startTime || 0;
        var stopTime = args.endTime || -1;

        // Set up player events
        this.player.onVolume(function () {
            var event = document.createEvent("HTMLEvents");
            event.initEvent("volumechange", true, true);
            _this.$element[0].dispatchEvent(event);
        });
        setInterval(function () {
            if (playing) {
                // Make sure that we are playing within bounds (give a buffer because flash vid isn't perfect)
                if (startTime !== 0 && _this.player.getTime() < startTime - 0.5) {
                    _this.player.seek(startTime);
                }
                if (stopTime !== -1 && _this.player.getTime() >= stopTime - 0.1) {
                    _this.player.seek(startTime);
                    _this.player.stop();
                }

                var event = document.createEvent("HTMLEvents");
                event.initEvent("timeupdate", true, true);
                _this.$element[0].dispatchEvent(event);
            }
        }, 50);

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    var videoDuration = this.player.getClip().fullDuration;
                    var stop = stopTime === -1 ? videoDuration : stopTime;
                    return stop - startTime;
                }
            },
            currentTime: {
                get: function () {
                    return this.player.getTime() - startTime;
                },
                set: function (time) {
                    time = Math.floor(Number(time)* 100) / 100;
                    this.player.seek(time);
                }
            },
            muted: {
                get: function () {
                    return this.player.getVolume() === 0;
                },
                set: function (muted) {
                    if (!!muted) {
                        this.player.mute();
                    } else {
                        this.player.unmute();
                    }
                }
            },
            paused: {
                get: function () {
                    return this.player.isPaused();
                }
            },
            playbackRate: {
                get: function () {
                    return 1;
                },
                set: function (playbackRate) {
                    //this.$video[0].playbackRate = Number(playbackRate);
                }
            },
            readyState: {
                get: function () {
                    return this.player.getState();
                }
            },
            volume: {
                get: function () {
                    return this.player.getVolume() / 100;
                },
                set: function (volume) {
                    volume = Number(volume) * 100;
                    this.player.setVolume(volume);
                }
            }
        });
    }

    FlashVideoPlayer.prototype.play = function() {
        this.player.play();
    };

    FlashVideoPlayer.prototype.pause = function() {
        this.player.pause();
    };

    FlashVideoPlayer.prototype.enterFullScreen = function(availableHeight) {
        this.normalHeight = this.$element.height();
        this.$element.height(availableHeight);
    };

    FlashVideoPlayer.prototype.exitFullScreen = function() {
        this.$element.height(this.normalHeight);
    };


    Ayamel.mediaPlugins.flashVideo = {
        install: function(args) {

            // Include the flowplayer script
            $("head").append("<script type='text/javascript' src='" + Ayamel.path + "js/plugins/flowplayer/flowplayer-3.2.12.min.js'></script>");

            return new FlashVideoPlayer(args);
        },
        supports: function(resource) {

            // Ensure that the browser supports flash
            var hasFlash = false;
            try {
                var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                if(fo) hasFlash = true;
            }catch(e){
                if(navigator.mimeTypes ["application/x-shockwave-flash"] != undefined) hasFlash = true;
            }
            if (!hasFlash)
                return false;

            // Check that there is a supported resource
            return resource.content.files.reduce(function (prev, file) {
                return prev || (resource.type === "video" && supportsFile(file));
            }, false);
        }
    };
}(Ayamel));