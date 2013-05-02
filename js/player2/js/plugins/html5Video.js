(function(Ayamel) {
    "use strict";

    var template = "<div class='videoBox'><video></video></div>";
    var captionHolderTemplate = '<div class="videoCaptionHolder"></div>';

    var supports = ["probably", "maybe"];

    var events = {
        abort: 'error',                     // Data loading was aborted
        error: 'error',                     // An error occured
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

    function supportsFile(video, file) {
        return supports.indexOf(video.canPlayType(file.mime)) >= 0;
    }

    function findFile(resource) {
        for (var i=0; i<resource.content.files.length; i += 1) {
            var file = resource.content.files[i];
            if (supportsFile(this.$video[0], file))
                return file;
        }
        return null;
    }

    function Html5VideoPlayer(args) {
        var _this = this;
        var width;
        var file;

        // Create the element
        this.$element = $(template);
        this.$video = this.$element.children("video");
        args.$holder.append(this.$element);

        // Create a place for captions
        this.$captionsElement = $(captionHolderTemplate);
        args.$holder.append(this.$captionsElement);

        // Set up the aspect ratio
        args.aspectRatio = args.aspectRatio || Ayamel.aspectRatios.hdVideo;
        width = _this.$element.width();
        var height = width / args.aspectRatio;
        _this.$element.height(height);

        // Load the source
        file = findFile.call(this, args.resource);
        this.$video[0].src = file.downloadUri;

        // Set up event propagation
        Object.keys(events).forEach(function (eventName) {
            _this.$video[0].addEventListener(eventName, function (event) {
                event.stopPropagation();

                var newEvent = document.createEvent("HTMLEvents");
                newEvent.initEvent(events[eventName], true, true);
                _this.$element[0].dispatchEvent(newEvent);
            });
        });

        // Set up the duration
        var startTime = args.startTime || 0;
        var stopTime = args.endTime || -1;
        this.$element[0].addEventListener("timeupdate", function(event) {
            if (_this.$video[0].currentTime < startTime)
                _this.$video[0].currentTime = startTime;

            if (stopTime != -1 && _this.$video[0].currentTime > stopTime) {
                _this.$video[0].pause();
                _this.$video[0].currentTime = startTime;
            }
        });

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    var videoDuration = this.$video[0].duration;
                    var stop = stopTime === -1 ? videoDuration : stopTime;
                    return stop - startTime;
                }
            },
            currentTime: {
                get: function () {
                    return this.$video[0].currentTime - startTime;
                },
                set: function (time) {
                    time = Math.floor(Number(time)* 100) / 100;
                    this.$video[0].currentTime = time;
                }
            },
            muted: {
                get: function () {
                    return this.$video[0].muted;
                },
                set: function (muted) {
                    this.$video[0].muted = !!muted;
                }
            },
            paused: {
                get: function () {
                    return this.$video[0].paused;
                }
            },
            playbackRate: {
                get: function () {
                    return this.$video[0].playbackRate;
                },
                set: function (playbackRate) {
                    this.$video[0].playbackRate = Number(playbackRate);
                }
            },
            readyState: {
                get: function () {
                    return this.$video[0].readyState;
                }
            },
            volume: {
                get: function () {
                    return this.$video[0].volume;
                },
                set: function (volume) {
                    this.$video[0].volume = Number(volume);
                }
            }
        });
    }

    Html5VideoPlayer.prototype.play = function() {
        this.$video[0].play();
    };

    Html5VideoPlayer.prototype.pause = function() {
        this.$video[0].pause();
    };

    Html5VideoPlayer.prototype.enterFullScreen = function(availableHeight) {
        this.normalHeight = this.$element.height();
        this.$element.height(availableHeight);
    };

    Html5VideoPlayer.prototype.exitFullScreen = function() {
        this.$element.height(this.normalHeight);
    };

    Ayamel.mediaPlugins.push({
        install: function(args) {
            return new Html5VideoPlayer(args);
        },
        supports: function(resource) {
            var video = document.createElement("video");
            return resource.content.files.reduce(function (prev, file) {
                return prev || (resource.type === "video" && supportsFile(video, file));
            }, false);
        }
    });

}(Ayamel));