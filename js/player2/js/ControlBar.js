(function(Ayamel) {
    "use strict";

    var template =
        '<div class="controlBar">' +
            '<div class="leftControls"></div>' +
            '<div class="rightControls"></div>' +
        '</div>';

    function createElement() {
        return $(template);
    }

    function ControlBar(args) {
        var _this = this;
        var $activeControls;

        // Create the element
        this.$element = createElement();
        args.$holder.append(this.$element);

        // Create the control bar components
        args.components = args.components || [["play", "volume", "captions"], ["fullScreen", "timeCode"]];
        this.components = {};
        function addComponent(component) {
            if (component === "play") {
                _this.components.play = new Ayamel.classes.PlayButton({
                    $holder: $activeControls
                });
            }
            if (component === "volume") {
                _this.components.volume = new Ayamel.classes.VolumeSlider({
                    $holder: $activeControls
                });
            }
            if (component === "timeCode") {
                _this.components.timeCode = new Ayamel.classes.TimeCode({
                    $holder: $activeControls
                });
            }
            if (component === "captions") {
                _this.components.captions = new Ayamel.classes.CaptionsMenu({
                    $holder: $activeControls
                });
            }
            if (component === "fullScreen") {
                _this.components.fullScreen = new Ayamel.classes.FullScreenButton({
                    $holder: $activeControls
                });
            }
        }
        $activeControls = this.$element.children(".leftControls");
        args.components[0].forEach(addComponent);
        $activeControls = this.$element.children(".rightControls");
        args.components[1].forEach(addComponent);

        Object.defineProperties(this, {
            currentTime: {
                set: function (value) {
                    if (this.components.timeCode) {
                        this.components.timeCode.currentTime = value;
                    }
                }
            },
            duration: {
                set: function (value) {
                    if (this.components.timeCode) {
                        this.components.timeCode.duration = value;
                    }
                }
            },
            fullScreen: {
                set: function (value) {
                    if (this.components.fullScreen) {
                        this.components.fullScreen.fullScreen = value;
                    }
                }
            },
            playing: {
                set: function (value) {
                    if (this.components.play) {
                        this.components.play.playing = !!value;
                    }
                }
            }
        });
    }

    ControlBar.prototype.addTrack = function(track) {
        if (this.components.captions) {
            this.components.captions.addTrack(track);
        }
    };

    ControlBar.prototype.addEventListener = function(event, callback) {
        this.$element[0].addEventListener(event, callback);
    };

    Ayamel.classes.ControlBar = ControlBar;
}(Ayamel));