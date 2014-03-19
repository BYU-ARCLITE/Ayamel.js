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
            endTime = processTime(args.endTime || -1),
            trackMap = window.Map?(new Map):null,
            pluginFeatures;

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        this.textTrackResources = trackMap;

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
            endTime: endTime,
            featureCallback: function(features) {
                pluginFeatures = features;
            }
        });

        // Create the ControlBar
        this.controlBar = new Ayamel.classes.ControlBar({
            $holder: $element,
            components: args.components,
            pluginFeatures: pluginFeatures
        });

        // Create the caption renderer
        if (this.mediaPlayer.captionsElement) {
            if(args.captionRenderer instanceof TimedText.CaptionRenderer){
                this.captionRenderer = args.captionRenderer;
                this.captionRenderer.target = this.mediaPlayer.captionsElement;
                this.captionRenderer.appendCueCanvasTo = this.mediaPlayer.captionsElement;
            }else{
                this.captionRenderer = new TimedText.CaptionRenderer({
                    target: this.mediaPlayer.captionsElement,
                    appendCueCanvasTo: this.mediaPlayer.captionsElement,
                    renderCue: args.renderCue
                });
            }
            this.captionRenderer.bindMediaElement(this.mediaPlayer);
        }

        // Load the caption tracks
        if (args.captionTracks) {
            async.map(args.captionTracks, function (resource, callback) {
                Ayamel.utils.loadCaptionTrack(resource, function (track, mime) {
                    track.mime = mime;
                    _this.addTextTrack(track);
                    if(trackMap){ trackMap.set(track, resource); }
                    callback(null, track);
                });
            }, function (err, tracks) {
                if (typeof args.captionTrackCallback === 'function')
                    args.captionTrackCallback(tracks,trackMap);
            });
        }

        /*
         * ==========================================================================================
         *                                      Key bindings
         * ==========================================================================================
         */

        Ayamel.KeyBinder.addKeyBinding(Ayamel.KeyBinder.keyCodes.space, function() {
            // Don't do anything if in a text box
            if (["TEXTAREA", "INPUT"].indexOf(document.activeElement.nodeName) === -1) {
                if (_this.mediaPlayer.paused) {
                    _this.mediaPlayer.play();
                    _this.controlBar.playing = true;
                } else {
                    _this.mediaPlayer.pause();
                    _this.controlBar.playing = false;
                }
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
            _this.mediaPlayer.currentTime = event.detail.progress * length + startTime;
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
            _this.mediaPlayer.volume = event.detail.volume;
            _this.controlBar.volume = _this.mediaPlayer.volume;
        });

        // Change the playback rate when the rate controls are adjusted
        this.controlBar.addEventListener("ratechange", function(event) {
            event.stopPropagation();
            _this.mediaPlayer.playbackRate = event.detail.playbackRate;
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
            event.detail.track.mode = "showing";
            _this.captionRenderer.rebuildCaptions();
        });
        this.controlBar.addEventListener("disabletrack", function(event) {
            event.detail.track.mode = "disabled";
            _this.captionRenderer.rebuildCaptions();
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

        this.controlBar.addEventListener("captionJump", function(event) {
            // Find the first visible track
            var track = _this.captionRenderer.tracks.filter(function(track){return track.mode === "showing";})[0];
            if (track) {
                // Move forward or back a caption
                var traversal = Ayamel.utils.CaptionsTranversal[event.detail.direction];
                _this.currentTime = traversal(track, _this.currentTime);
            }
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

    AyamelPlayer.prototype.addTextTrack = function(track) {
        if(!this.captionRenderer){ return; }
        if(this.captionRenderer.tracks.indexOf(track) !== -1){ return; }
        this.captionRenderer.addTextTrack(track);
        if (this.controlBar.components.captions) {
            this.controlBar.components.captions.addTrack(track);
        }
    };

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