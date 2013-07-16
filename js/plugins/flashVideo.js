/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/6/13
 * Time: 8:34 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {

    var template = "<div class='videoBox'><div id='flowplayerHolder'></div></div>",
        captionHolderTemplate = '<div class="videoCaptionHolder"></div>',
        installed = false,
        supportedMimeTypes = [
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
        var _this = this,
            playing = false,
            swfPath = Ayamel.path + "js/plugins/flowplayer/flowplayer-3.2.16.swf",
            $element = $(template),
            element = $element[0],
            $captionsElement = $(captionHolderTemplate),
            captionsElement = $captionsElement[0],
            startTime = +args.startTime || 0,
            stopTime = +args.endTime || -1,
            width, height, player;

        // Create the element
        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

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

        function fireTimeEvents() {
            if (!playing) { return; }
            // Make sure that we are playing within bounds (give a buffer because flash vid isn't perfect)
            if (startTime !== 0 && player.getTime() < startTime - 0.5) {
                player.seek(startTime);
            }
            if (stopTime !== -1 && player.getTime() >= stopTime - 0.1) {
                player.seek(startTime);
                player.stop();
            }

            
            element.dispatchEvent(new Event('timeupdate',{bubbles:true,cancelable:true}));

            if(Ayamel.utils.Animation){
                Ayamel.utils.Animation.requestFrame(fireTimeEvents);
            }else{
                setTimeout(fireTimeEvents, 50);
            }
        }

        // Create the player
        player = flowplayer("flowplayerHolder", {
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
                    playing = false;
                    element.dispatchEvent(new Event('ended',{bubbles:true,cancelable:true}));
                },
                onMetaData: function() {
                    element.dispatchEvent(new Event('durationchange',{bubbles:true,cancelable:true}));
                },
                onPause: function() {
                    playing = false;
                    element.dispatchEvent(new Event('pause',{bubbles:true,cancelable:true}));
                },
                onResume: function() {
                    playing = true;
                    element.dispatchEvent(new Event('play',{bubbles:true,cancelable:true}));
                    fireTimeEvents();
                },
                onStart: function() {
                    playing = true;
                    element.dispatchEvent(new Event('play',{bubbles:true,cancelable:true}));
                    fireTimeEvents();
                },
                onStop: function() {
					playing = false;
                    element.dispatchEvent(new Event('pause',{bubbles:true,cancelable:true}));
                },
                onVolume: function () {
                    element.dispatchEvent(new Event('volumechange',{bubbles:true,cancelable:true}));
                }
            },

            play: null,

            plugins: {
                controls: null
            }
        });

        this.player = player;

        Object.defineProperties(this, {
            duration: {
                get: function () {
//                    var stop = stopTime === -1 ? player.getClip().fullDuration : stopTime;
//                    return stop - startTime;
                    return player.getClip().fullDuration;
                }
            },
            currentTime: {
                get: function () {
//                    return player.getTime() - startTime;
                    return player.getTime();
                },
                set: function (time) {
                    time = Math.floor((+time||0) * 100) / 100;
//                    player.seek(time + startTime);
                    player.seek(time);
                    element.dispatchEvent(new Event('timeupdate',{bubbles:true,cancelable:true}));
                    return time;
                }
            },
            muted: {
                get: function () {
                    return player.getVolume() === 0;
                },
                set: function (muted) {
                    muted = !!muted;
                    player[muted?'mute':'unmute']();
                    return muted;
                }
            },
            paused: {
                get: function () {
                    return player.isPaused();
                }
            },
            playbackRate: {
                get: function () {
                    return 1;
                },
                set: function (playbackRate) {
                    //this.$video[0].playbackRate = Number(playbackRate);
                    return 1;
                }
            },
            readyState: {
                get: function () {
                    return player.getState();
                }
            },
            volume: {
                get: function () {
                    return player.getVolume() / 100;
                },
                set: function (volume) {
                    volume = (+volume||0) * 100;
                    player.setVolume(volume);
                    return volume;
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

    Ayamel.mediaPlugins.video.flash = {
        install: function(args) {
            if(!installed){
                // Include the flowplayer script
                $("head").append("<script type='text/javascript' src='" + Ayamel.path + "js/plugins/flowplayer/flowplayer-3.2.12.min.js'></script>");
                installed = true;
            }
            return new FlashVideoPlayer(args);
        },
        supports: function(resource) {

            // Ensure that the browser supports flash
            var hasFlash = false;
            try {
                hasFlash = !!(new ActiveXObject('ShockwaveFlash.ShockwaveFlash'));
            }catch(e){
                hasFlash = (typeof navigator.mimeTypes["application/x-shockwave-flash"] !== 'undefined');
            }

            // Check that there is a supported resource
            return hasFlash && resource.content.files.some(function (file) {
                return (resource.type === "video" && supportsFile(file));
            });
        },
        features: {
            desktop: {
                captions: true,
                fullScreen: true,
                lastCaption: true,
                play: true,
                rate: false,
                timeCode: true,
                volume: true
            },
            mobile: {
                captions: true,
                fullScreen: true,
                lastCaption: true,
                play: true,
                rate: false,
                timeCode: true,
                volume: false
            }
        }
    };

}(Ayamel));