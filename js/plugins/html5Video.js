(function(Ayamel) {
    "use strict";

    var template = "<div class='videoBox'><video></video></div>",
        captionHolderTemplate = '<div class="videoCaptionHolder"></div>',
        supports = ["probably", "maybe"],
        testVideo = document.createElement('video');

    var events = {
        abort: 'error',                     // Data loading was aborted
        error: 'error',                     // An error occurred
        emptied: 'error',                   // Data not present unexpectedly
        stalled: 'error',                   // Data transfer stalled
        play: 'play',                       // Video started playing (fired with play())
        pause: 'pause',                     // Video has paused (fired with pause())
        playing: 'play',                    // Playback started
        timeupdate: 'timeupdate',           // currentTime was changed
        seeked: 'seek',
        ended: 'ended',                     // Video has ended
        ratechange: 'ratechange',           // Playback rate has changed
        durationchange: 'durationchange',   // Duration has changed (for streams)
        loadedmetadata: 'loadedmetadata',   // Metadata (including duration) is fully loaded
        volumechange: 'volumechange'        // Volume has changed
    };

    function supportsFile(file) {
        return supports.indexOf(testVideo.canPlayType(file.mime)) >= 0;
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

    function Html5VideoPlayer(args) {
        var _this = this, file,
            height, width,
            startTime = +args.startTime || 0,
            stopTime = +args.endTime || -1,
            $element = $(template),
            element = $element[0],
            $captionsElement = $(captionHolderTemplate),
            captionsElement = $captionsElement[0],
            video = $element.children("video")[0];

        // Create the element
        this.$element = $element;
        this.element = element;
        args.$holder.append(element);

        this.video = video;

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

        // Load the source
        file = findFile.call(this, args.resource);
        video.src = file.downloadUri;

        // Set up event propagation
        Object.keys(events).forEach(function (eventName) {
            video.addEventListener(eventName, function (event) {
                var newEvent = document.createEvent("HTMLEvents");
                newEvent.initEvent(events[eventName], true, true);
                element.dispatchEvent(newEvent);
                event.stopPropagation();
            }, false);
        });

        // Set up the duration
        element.addEventListener("timeupdate", function(event) {
            if (video.currentTime < startTime)
                video.currentTime = startTime;
            if (stopTime != -1 && video.currentTime > stopTime) {
                video.pause();
                video.currentTime = startTime;
            }
        }, false);

        Object.defineProperties(this, {
            duration: {
                get: function () {
//                    var stop = stopTime === -1 ? video.duration : stopTime;
//                    return stop - startTime;
                    return video.duration;
                }
            },
            currentTime: {
                get: function () {
                    return video.currentTime;// - startTime;
                },
                set: function (time) {
                    return video.currentTime = (+time||0);// + startTime;
                }
            },
            muted: {
                get: function () {
                    return video.muted;
                },
                set: function (muted) {
                    return video.muted = !!muted;
                }
            },
            paused: {
                get: function () {
                    return video.paused;
                }
            },
            playbackRate: {
                get: function () {
                    return video.playbackRate;
                },
                set: function (playbackRate) {
                    playbackRate = +playbackRate
                    return video.playbackRate = isNaN(playbackRate)?1:playbackRate;
                }
            },
            readyState: {
                get: function () {
                    return video.readyState;
                }
            },
            volume: {
                get: function () {
                    return video.volume;
                },
                set: function (volume) {
                    return video.volume = +volume||0;
                }
            }
        });
    }

    Html5VideoPlayer.prototype.play = function() {
        this.video.play();
    };

    Html5VideoPlayer.prototype.pause = function() {
        this.video.pause();
    };

    Html5VideoPlayer.prototype.enterFullScreen = function(availableHeight) {
        this.normalHeight = this.$element.height();
        this.$element.height(availableHeight);
    };

    Html5VideoPlayer.prototype.exitFullScreen = function() {
        this.$element.height(this.normalHeight);
    };

    Ayamel.mediaPlugins.video.html5 = {
        install: function(args) {
            return new Html5VideoPlayer(args);
        },
        supports: function(resource) {
            return resource.content.files.some(function (file) {
                return (resource.type === "video" && supportsFile(file));
            });
        }
    };

}(Ayamel));