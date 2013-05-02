(function(Ayamel) {
    "use strict";

    var template = '<div class="ayamelPlayer"></div>';

    function createElement() {
        return $(template);
    }

    function AyamelPlayer(args) {
        var _this = this;

        this.$element = createElement();
        args.$holder.append(this.$element);

        /*
         * ==========================================================================================
         *                                      Module Creation
         * ==========================================================================================
         */

        // Create the MediaPlayer
        this.mediaPlayer = new Ayamel.classes.MediaPlayer({
            $holder: this.$element,
            resource: args.resource,
            aspectRatio: args.aspectRatio,
            startTime: args.startTime,
            endTime: args.endTime
        });

        // Create the ProgressBar
        this.progressBar = new Ayamel.classes.ProgressBar({
            $holder: this.$element
        });

        // Create the ControlBar
        this.controlBar = new Ayamel.classes.ControlBar({
            $holder: this.$element,
            components: args.components
        });

        // Create the caption renderer
        this.captionRenderer = new CaptionRenderer(this.mediaPlayer.$captionsElement[0], {
            appendCueCanvasTo: this.mediaPlayer.$captionsElement[0],
            renderCue: args.renderCue
        });
        this.captionRenderer.bindMediaElement(this.mediaPlayer);

        // Load the caption tracks
        if (args.captionTracks) {
            args.captionTracks.forEach(function (resource) {
                Ayamel.CaptionTrackLoader.load(resource, function (track) {
                    _this.captionRenderer.addTextTrack(track);
                    _this.controlBar.addTrack(track);
                });
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

        // Update the progress bar and control bar when the media is playing
        this.mediaPlayer.addEventListener("timeupdate", function(event) {
            var time = _this.mediaPlayer.currentTime;
            var duration = _this.mediaPlayer.duration;
            _this.progressBar.progress = time / duration;
            _this.controlBar.currentTime = time;
        });

        // When there is a duration change (such as on a load) then notify the control bar of this
        this.mediaPlayer.addEventListener("durationchange", function(event) {
            _this.controlBar.duration = _this.mediaPlayer.duration;
        });

        // When the media ends, notify the control bar of this
        this.mediaPlayer.addEventListener("ended", function(event) {
            _this.controlBar.playing = false;
        });

        //   Set up event listeners for the progress bar
        // -----------------------------------------------

        // When the user is done scrubbing, seek to that position
        this.progressBar.addEventListener("scrubend", function(event) {
            _this.mediaPlayer.currentTime = event.progress * _this.mediaPlayer.duration;
        });

        //   Set up event listeners for the control bar
        // ----------------------------------------------

        // Play the media when the play button is pressed
        this.controlBar.addEventListener("play", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.play();
        });

        // Pause the media when the pause button is pressed
        this.controlBar.addEventListener("pause", function(event) {
            _this.mediaPlayer.pause();
        });

        // Change the volume when the volume controls are adjusted
        this.controlBar.addEventListener("volumechange", function(event) {
            _this.mediaPlayer.volume = event.volume;
        });

        // Mute/unmute the media when the mute button is pressed
        this.controlBar.addEventListener("mute", function(event) {
            _this.mediaPlayer.muted = true;
        });
        this.controlBar.addEventListener("unmute", function(event) {
            _this.mediaPlayer.muted = false;
        });

        // Enable/disable caption tracks when clicked in the caption menu
        this.controlBar.addEventListener("enabletrack", function(event) {
            event.track.mode = "showing";
        });
        this.controlBar.addEventListener("disabletrack", function(event) {
            event.track.mode = "disabled";
        });

        // Enter/exit full screen when the button is pressed
        this.controlBar.addEventListener("enterfullscreen", function(event) {
            Ayamel.FullScreenHandler.enter(_this.$element[0]);

            // Add an event listener for exiting
            var full = false;
            _this.$element[0].addEventListener(Ayamel.FullScreenHandler.fullScreenEvent, function () {
                if (full) {
                    Ayamel.FullScreenHandler.exit(_this.$element[0]);
                    _this.mediaPlayer.exitFullScreen();
                    _this.controlBar.fullScreen = false;
                }
                full = !full;
            });

            // Figure out how much space we have for the media player to fill
            var availableHeight = Ayamel.FullScreenHandler.getAvailableHeight()
                - _this.progressBar.$element.height()
                - _this.controlBar.$element.height();
            _this.mediaPlayer.enterFullScreen(availableHeight);
        });
        this.controlBar.addEventListener("exitfullscreen", function(event) {
            Ayamel.FullScreenHandler.exit(_this.$element[0]);
            _this.mediaPlayer.exitFullScreen();
            _this.$element[0].removeEventListener(Ayamel.FullScreenHandler.fullScreenEvent);
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

    AyamelPlayer.prototype.addEventListener = function(event, callback) {
        this.$element[0].addEventListener(event, callback);
    };

    Ayamel.classes.AyamelPlayer = AyamelPlayer;
}(Ayamel));