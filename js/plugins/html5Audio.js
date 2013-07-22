(function(Ayamel) {
    "use strict";

    var template =
        "<div class='playerTop'>" +
            "<div class='audioCaptionContainer'>" +
                "<div class='audioCaptionHolder'></div>" +
            "</div>" +
        "</div>",
        supports = ["probably", "maybe"],
        testAudio = document.createElement("audio");

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

    function supportsFile(file) {
        return supports.indexOf(testAudio.canPlayType(file.mime)) >= 0;
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

    function Html5AudioPlayer(args) {
        var file, _this = this,
            startTime = +args.startTime || 0,
            stopTime = +args.endTime || -1,
            $element = $(template),
            element = $element[0],
            $captionsElement = $element.find(".audioCaptionHolder"),
            captionsElement = $captionsElement[0],
            audio = new Audio();

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        this.audio = audio;

        // Create a place for captions
        this.$captionsElement = $captionsElement;
        this.captionsElement = captionsElement;
//        args.$holder.append($captionsElement);

        // Load the source
        file = findFile.call(this, args.resource);
        audio.src = file.downloadUri;

        // Set up event propagation
        Object.keys(events).forEach(function (eventName) {
            audio.addEventListener(eventName, function (event) {
                element.dispatchEvent(new Event(events[eventName],{bubbles:true,cancelable:true}));
                event.stopPropagation();
            }, false);
        });

        // Set up the duration
        element.addEventListener("timeupdate", function(event) {
            if (audio.currentTime < startTime)
                audio.currentTime = startTime;
            if (stopTime != -1 && audio.currentTime > stopTime) {
                audio.pause();
                audio.currentTime = startTime;
            }
        }, false);

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    var stop = stopTime === -1 ? audio.duration : stopTime;
                    return stop - startTime;
                }
            },
            currentTime: {
                get: function () {
                    return audio.currentTime - startTime;
                },
                set: function (time) {
                    return audio.currentTime = (+time||0) + startTime;
                }
            },
            muted: {
                get: function () {
                    return audio.muted;
                },
                set: function (muted) {
                    return audio.muted = !!muted;
                }
            },
            playbackRate: {
                get: function () {
                    return audio.playbackRate;
                },
                set: function (playbackRate) {
                    playbackRate = +playbackRate
                    return audio.playbackRate = isNaN(playbackRate)?1:playbackRate;
                }
            },
            readyState: {
                get: function () {
                    return audio.readyState;
                }
            },
            volume: {
                get: function () {
                    return audio.volume;
                },
                set: function (volume) {
                    return audio.volume = +volume||0;
                }
            }
        });
    }

    Html5AudioPlayer.prototype.play = function() {
        this.audio.play();
    };

    Html5AudioPlayer.prototype.pause = function() {
        this.audio.pause();
    };

    Html5AudioPlayer.prototype.enterFullScreen = function(availableHeight) {
        this.normalHeight = this.$element.height();
        this.$element.height(availableHeight);
    };

    Html5AudioPlayer.prototype.exitFullScreen = function() {
        this.$element.height(this.normalHeight);
    };

    Ayamel.mediaPlugins.audio.html5 = {
        install: function(args) {
            return new Html5AudioPlayer(args);
        },
        supports: function(resource) {
            return resource.content.files.some(function (file) {
                return (resource.type === "audio" && supportsFile(file));
            });
        },
        features: {
            desktop: {
                captions: true,
                fullScreen: false,
                lastCaption: true,
                play: true,
                rate: true,
                timeCode: true,
                volume: true
            },
            mobile: {
                captions: true,
                fullScreen: false,
                lastCaption: true,
                play: true,
                rate: false,
                timeCode: true,
                volume: false
            }
        }
    };

}(Ayamel));