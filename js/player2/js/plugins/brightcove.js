/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/6/13
 * Time: 1:37 PM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {

    var template = "<div class='videoBox'></div>";
    var captionHolderTemplate = '<div class="videoCaptionHolder"></div>';

    function supportsFile(file) {
        return file.streamUri && file.streamUri.substr(0,13) === "brightcove://";
    }

    function findFile(resource) {
        for (var i=0; i<resource.content.files.length; i += 1) {
            var file = resource.content.files[i];
            if (supportsFile(file))
                return file;
        }
        return null;
    }

    function generateBrightcoveTemplate(videoId) {
        return '' +
            '<object id="myExperience" class="BrightcoveExperience">' +
                '<param name="bgcolor" value="#FFFFFF" />' +
                '<param name="width" value="100%" />' +
                '<param name="height" value="100%" />' +
                '<param name="playerID" value="2359958964001" />' +
                '<param name="playerKey" value="AQ~~,AAABBjeLsAk~,DhYCBe7490IkhazTuLjixXSBXs1PvEho" />' +
                '<param name="isSlim" value="true" />' +
                '<param name="dynamicStreaming" value="true" />' +
                '<param name="includeAPI" value="true" />' +
                '<param name="templateLoadHandler" value="brightcoveTemplateLoaded" />' +
                '<param name="@videoPlayer" value="' + videoId + '" />' +
                '<param name="templateReadyHandler" value="brightcoveTemplateReady" />' +
            '</object>';
    }

    function BrightcoveVideoPlayer(args) {
        var _this = this;
        var file = findFile(args.resource);
        var videoId = file.streamUri.substr(13);
        var properties = {
            duration: 0,
            currentTime: 0,
            paused: true
        };

        // Create the element
        this.$element = $(template);
        this.$element.append(generateBrightcoveTemplate(videoId));
        args.$holder.append(this.$element);

        // Create a place for captions
        this.$captionsElement = $(captionHolderTemplate);
        args.$holder.append(this.$captionsElement);

        // Set up the aspect ratio
        args.aspectRatio = args.aspectRatio || Ayamel.aspectRatios.hdVideo;
        width = _this.$element.width();
        var height = width / args.aspectRatio;
        _this.$element.height(height);

        // Register the global callbacks
        window.brightcoveTemplateLoaded = function brightcoveTemplateLoaded(experienceID) {
            var brightcoveExperience = brightcove.api.getExperience(experienceID);
            _this.player = brightcoveExperience.getModule(brightcove.api.modules.APIModules.VIDEO_PLAYER);
        };

        window.brightcoveTemplateReady = function brightcoveTemplateReady(experienceID) {
            var events = {};
            events[brightcove.api.events.MediaEvent.BEGIN] = "durationchange";
            events[brightcove.api.events.MediaEvent.CHANGE] = "durationchange";
            events[brightcove.api.events.MediaEvent.COMPLETE] = "ended";
            events[brightcove.api.events.MediaEvent.ERROR] = "error";
            events[brightcove.api.events.MediaEvent.PLAY] = "play";
            events[brightcove.api.events.MediaEvent.PROGRESS] = "timeupdate";
            events[brightcove.api.events.MediaEvent.SEEK_NOTIFY] = "seek";
            events[brightcove.api.events.MediaEvent.STOP] = "pause";

            function updateProperties(event) {
                properties.currentTime = event.position;
                properties.duration = event.duration;
                if (event.type === brightcove.api.events.MediaEvent.PLAY) {
                    properties.paused = false;
                }
                if (event.type === brightcove.api.events.MediaEvent.STOP || event.type === brightcove.api.events.MediaEvent.COMPLETE) {
                    properties.paused = true;
                }
            }

            Object.keys(events).forEach(function (brightcoveEvent) {
                _this.player.addEventListener(brightcoveEvent, function(event) {
                    updateProperties(event);
                    var newEvent = document.createEvent("HTMLEvents");
                    newEvent.initEvent(events[brightcoveEvent], true, true);
                    _this.$element[0].dispatchEvent(newEvent);
                });
            });
        };

        // Create the player
        brightcove.createExperiences();

        // TODO: Set up the duration
        var startTime = 0;
        var stopTime = -1;

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    var videoDuration = properties.duration;
                    var stop = stopTime === -1 ? videoDuration : stopTime;
                    return stop - startTime;
                }
            },
            currentTime: {
                get: function () {
                    return properties.currentTime - startTime;
                },
                set: function (time) {
                    time = Math.floor(Number(time)* 100) / 100;
                    this.player.seek(time);
                }
            },
            muted: {
                get: function () {
                    return false;
                    //return this.$video[0].muted;
                },
                set: function (muted) {
                    //this.$video[0].muted = !!muted;
                }
            },
            paused: {
                get: function () {
                    return properties.paused;
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
                    return 0;//this.$video[0].readyState;
                }
            },
            volume: {
                get: function () {
//                    return this.$video[0].volume;
                    return 1;
                },
                set: function (volume) {
//                    this.$video[0].volume = Number(volume);
                }
            }
        });

    }

    BrightcoveVideoPlayer.prototype.play = function() {
        this.player.play();
    };

    BrightcoveVideoPlayer.prototype.pause = function() {
        this.player.pause();
    };

    BrightcoveVideoPlayer.prototype.enterFullScreen = function(availableHeight) {
        this.normalHeight = this.$element.height();
        this.$element.height(availableHeight);
    };

    BrightcoveVideoPlayer.prototype.exitFullScreen = function() {
        this.$element.height(this.normalHeight);
    };

    Ayamel.mediaPlugins.brightcove = {
        install: function(args) {
            // Create the player
            return new BrightcoveVideoPlayer(args);
        },
        supports: function(resource) {
            return resource.content.files.reduce(function (prev, file) {
                return prev || (resource.type === "video" && supportsFile(file));
            }, false);
        }
    }
}(Ayamel));