(function(Ayamel) {
    "use strict";

    var template = '<div class="ayamelPlayer"></div>';

    function processTime(time) {
        if (typeof time === "number") {
            return time;
        }
        return time.split(":").reduce(function(last, next){
            return last * 60 + (+next||0);
        }, 0);
    }

    function AyamelPlayer(args) {
        var _this = this,
            $element = $(template),
            element = $element[0],
            startTime = processTime(args.startTime || 0),
            endTime = processTime(args.endTime || -1);

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        /*
         * ==========================================================================================
         *                                      Module Creation
         * ==========================================================================================
         */

        // Create the MediaPlayer
        this.mediaPlayer = new Ayamel.classes.MediaPlayer({
            $holder: $element,
            resource: args.resource,
            aspectRatio: args.aspectRatio,
            startTime: startTime,
            endTime: endTime
        });

        // Create the ControlBar
        this.controlBar = new Ayamel.classes.ControlBar({
            $holder: $element,
            components: args.components
        });

        // Create the caption renderer
        if (this.mediaPlayer.$captionsElement) {
            this.captionRenderer = new CaptionRenderer(this.mediaPlayer.captionsElement, {
                appendCueCanvasTo: this.mediaPlayer.captionsElement,
                renderCue: args.renderCue
            });
            this.captionRenderer.bindMediaElement(this.mediaPlayer);
        }

        // Load the caption tracks
        if (args.captionTracks) {
            async.map(args.captionTracks, function (resource, callback) {
                Ayamel.utils.loadCaptionTrack(resource, function (track) {
                    track.resourceId = resource.id;
                    _this.captionRenderer.addTextTrack(track);
                    _this.controlBar.addTrack(track);
                    callback(null, track);
                });
            }, function (err, tracks) {
                if (args.captionTrackCallback)
                    args.captionTrackCallback(tracks);
            });
        }

        /*
         * ==========================================================================================
         *                                      Key bindings
         * ==========================================================================================
         */

        Ayamel.KeyBinder.addKeyBinding(Ayamel.KeyBinder.keyCodes.space, function() {
            if (_this.mediaPlayer.paused) {
                _this.mediaPlayer.play();
                _this.controlBar.playing = true;
            } else {
                _this.mediaPlayer.pause();
                _this.controlBar.playing = false;
            }
        });

        /*
         * ==========================================================================================
         *                                      Event handling
         * ==========================================================================================
         */

        //   Set up event listeners for the media player
        // -----------------------------------------------

        // Update the control bar when the media is playing
        this.mediaPlayer.addEventListener("timeupdate", function(event) {
            // It's ok to lie to the control bar about the time
            _this.controlBar.currentTime = _this.mediaPlayer.currentTime - startTime;
        });

        // When there is a duration change (such as on a load) then notify the control bar of this
        this.mediaPlayer.addEventListener("durationchange", function(event) {
            // It's ok to lie to the control bar about the time
            var duration = endTime === -1 ? _this.mediaPlayer.duration : endTime;
            _this.controlBar.duration = duration - startTime;
        });

        // When the media ends, notify the control bar of this
        this.mediaPlayer.addEventListener("ended", function(event) {
            _this.controlBar.playing = false;
        });

        // When the media ends, notify the control bar of this
        this.mediaPlayer.addEventListener("pause", function(event) {
            _this.controlBar.playing = false;
        });

        // When the media ends, notify the control bar of this
        this.mediaPlayer.addEventListener("play", function(event) {
            _this.controlBar.playing = true;
        });

        //   Set up event listeners for the control bar
        // ----------------------------------------------

        // When the user is done scrubbing, seek to that position
        this.controlBar.addEventListener("scrubend", function(event) {
            // If we have been lying to the control bar, then keep that in mind
            var length = (endTime === -1 ? _this.mediaPlayer.duration : endTime) - startTime;
            _this.mediaPlayer.currentTime = event.progress * length + startTime;
        });

        // Play the media when the play button is pressed
        this.controlBar.addEventListener("play", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.play();
        });

        // Pause the media when the pause button is pressed
        this.controlBar.addEventListener("pause", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.pause();
        });

        // Change the volume when the volume controls are adjusted
        this.controlBar.addEventListener("volumechange", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.volume = event.volume;
            _this.controlBar.volume = _this.mediaPlayer.volume;
        });

        // Change the playback rate when the rate controls are adjusted
        this.controlBar.addEventListener("ratechange", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.playbackRate = event.playbackRate;
            _this.controlBar.playbackRate = _this.mediaPlayer.playbackRate;
        });

        // Mute/unmute the media when the mute button is pressed
        this.controlBar.addEventListener("mute", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.muted = true;
            _this.controlBar.muted = _this.mediaPlayer.muted;
        });
        this.controlBar.addEventListener("unmute", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.muted = false;
            _this.controlBar.muted = _this.mediaPlayer.muted;
        });

        // Enable/disable caption tracks when clicked in the caption menu
        this.controlBar.addEventListener("enabletrack", function(event) {
//            event.stopPropagation();
            event.track.mode = "showing";
        });
        this.controlBar.addEventListener("disabletrack", function(event) {
//            event.stopPropagation();
            event.track.mode = "disabled";
        });

        // Enter/exit full screen when the button is pressed

         function fullScreenChangeHandler() {
            if (!Ayamel.utils.FullScreen.isFullScreen) {
                Ayamel.utils.FullScreen.exit(element);
                _this.mediaPlayer.exitFullScreen();
                _this.controlBar.fullScreen = false;
            }
        }

        this.controlBar.addEventListener("enterfullscreen", function(event) {
            // Figure out how much space we have for the media player to fill
            var availableHeight = Ayamel.utils.FullScreen.availableHeight
                - _this.controlBar.$element.height();

            Ayamel.utils.FullScreen.enter(element);
            _this.mediaPlayer.enterFullScreen(availableHeight);

            // Add an event listener for exiting due to external causes
            element.addEventListener(Ayamel.utils.FullScreen.fullScreenEvent,fullScreenChangeHandler,false);

            event.stopPropagation();
        });

        this.controlBar.addEventListener("exitfullscreen", function(event) {
            Ayamel.utils.FullScreen.exit();
            _this.mediaPlayer.exitFullScreen();
            element.removeEventListener(Ayamel.utils.FullScreen.fullScreenEvent,fullScreenChangeHandler,false);
        });

        /*
         * ==========================================================================================
         *                                      Attributes
         * ==========================================================================================
         */

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    return this.mediaPlayer.duration;
                }
            },
            currentTime: {
                get: function () {
                    return this.mediaPlayer.currentTime;
                },
                set: function (time) {
                    this.mediaPlayer.currentTime = time;
                }
            },
            muted: {
                get: function () {
                    return this.mediaPlayer.muted;
                },
                set: function (muted) {
                    this.mediaPlayer.muted = muted;
                }
            },
            paused: {
                get: function () {
                    return this.mediaPlayer.paused;
                }
            },
            playbackRate: {
                get: function () {
                    return this.mediaPlayer.playbackRate;
                },
                set: function (playbackRate) {
                    this.mediaPlayer.playbackRate = playbackRate;
                }
            },
            readyState: {
                get: function () {
                    return this.mediaPlayer.readyState;
                }
            },
            volume: {
                get: function () {
                    return this.mediaPlayer.volume;
                },
                set: function (volume) {
                    this.mediaPlayer.volume = volume;
                }
            }
        });
    }

    AyamelPlayer.prototype.play = function() {
        this.mediaPlayer.play();
    };

    AyamelPlayer.prototype.pause = function() {
        this.mediaPlayer.pause();
    };

    AyamelPlayer.prototype.addEventListener = function(event, callback, capture) {
        this.element.addEventListener(event, callback, !!capture);
    };

    AyamelPlayer.prototype.removeEventListener = function(event, callback, capture) {
        this.element.removeEventListener(event, callback, !!capture);
    };

    Ayamel.classes.AyamelPlayer = AyamelPlayer;
}(Ayamel));