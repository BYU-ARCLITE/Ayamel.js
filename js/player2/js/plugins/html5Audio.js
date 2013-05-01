(function(Ayamel) {
    "use strict";

    var template =
        "<div class='playerTop'>" +
            "<div class='audioCaptionContainer'>" +
                "<div class='audioCaptionHolder'></div>" +
            "</div>" +
            "<audio></audio>" +
        "</div>";

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

    function supportsFile(audio, file) {
        return supports.indexOf(audio.canPlayType(file.mime)) >= 0;
    }

    function findFile(resource) {
        for (var i=0; i<resource.content.files.length; i += 1) {
            var file = resource.content.files[i];
            if (supportsFile(this.$audio[0], file))
                return file;
        }
        return null;
    }

    function Html5AudioPlayer(args) {
        var _this = this;
        var file;

        // Create the element
        this.$element = $(template);
        this.$audio = this.$element.children("audio");
        args.$holder.append(this.$element);

        // Create a place for captions
        this.$captionsElement = this.$element.find(".audioCaptionHolder");

        // Load the source
        file = findFile.call(this, args.resource);
        this.$audio[0].src = file.downloadUri;

        // Set up event propagation
        Object.keys(events).forEach(function (eventName) {
            _this.$audio[0].addEventListener(eventName, function (event) {
                event.stopPropagation();

                var newEvent = document.createEvent("HTMLEvents");
                newEvent.initEvent(events[eventName], true, true);
                _this.$element[0].dispatchEvent(newEvent);
            });
        });

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    return this.$audio[0].duration;
                }
            },
            currentTime: {
                get: function () {
                    return this.$audio[0].currentTime;
                },
                set: function (time) {
                    this.$audio[0].currentTime = Number(time);
                }
            },
            muted: {
                get: function () {
                    return this.$audio[0].muted;
                },
                set: function (muted) {
                    this.$audio[0].muted = !!muted;
                }
            },
            playbackRate: {
                get: function () {
                    return this.$audio[0].playbackRate;
                },
                set: function (playbackRate) {
                    this.$audio[0].playbackRate = Number(playbackRate);
                }
            },
            readyState: {
                get: function () {
                    return this.$audio[0].readyState;
                }
            },
            volume: {
                get: function () {
                    return this.$audio[0].volume;
                },
                set: function (volume) {
                    this.$audio[0].volume = Number(volume);
                }
            }
        });
    }

    Html5AudioPlayer.prototype.play = function() {
        this.$audio[0].play();
    };

    Html5AudioPlayer.prototype.pause = function() {
        this.$audio[0].pause();
    };

    Html5AudioPlayer.prototype.enterFullScreen = function(availableHeight) {
        this.normalHeight = this.$element.height();
        this.$element.height(availableHeight);
    };

    Html5AudioPlayer.prototype.exitFullScreen = function() {
        this.$element.height(this.normalHeight);
    };

    Ayamel.mediaPlugins.push({
        install: function(args) {
            return new Html5AudioPlayer(args);
        },
        supports: function(resource) {
            var audio = document.createElement("audio");
            return resource.content.files.reduce(function (prev, file) {
                return prev || (resource.type === "audio" && supportsFile(audio, file));
            }, false);
        }
    });

}(Ayamel));