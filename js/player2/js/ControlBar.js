(function(Ayamel) {
    "use strict";

    var template =
        '<div class="controlBar">' +
            '<div class="leftControls"></div>' +
            '<div class="rightControls"></div>' +
        '</div>',
		componentConstructorMap = {
			"play": "PlayButton",
			"rate": "RateSlider",
			"volume": "VolumeSlider",
			"timeCode": "TimeCode",
			"captions": "CaptionsMenu",
			"fullScreen": "FullScreenButton"
		};

    function ControlBar(args) {
        var _this = this,
			$element = $(template);

        // Create the element
        this.$element = $element;
		this.element = $element[0];
        args.$holder.append(this.$element);

        // Create the control bar components
        args.components = args.components || [["play", "volume", "captions"], ["rate", "fullScreen", "timeCode"]];
        this.components = {};
        function addComponent($controls, component) {
			_this.components[component] = new Ayamel.classes[componentConstructorMap[component]]({
				$holder: $controls
			});
        }
        args.components[0].forEach(addComponent.bind(null,$element.children(".leftControls")));
        args.components[1].forEach(addComponent.bind(null,$element.children(".rightControls")));

        Object.defineProperties(this, {
            currentTime: {
				enumerable: true,
                set: function (value) {
                    if (this.components.timeCode) {
                        this.components.timeCode.currentTime = value;
                    }
                },
				get: function () {
					return this.components.timeCode?this.components.timeCode.currentTime:0;
				}
            },
            duration: {
				enumerable: true,
                set: function (value) {
                    if (this.components.timeCode) {
                        this.components.timeCode.duration = value;
                    }
                },
				get: function () {
					return this.components.timeCode?this.components.timeCode.duration:0;
				}
            },
            fullScreen: {
				enumerable: true,
                set: function (value) {
                    if (this.components.fullScreen) {
                        this.components.fullScreen.fullScreen = !!value;
                    }
                },
				get: function () {
					return this.components.fullScreen?this.components.fullScreen.fullScreen:false;
				}
            },
            playing: {
				enumerable: true,
                set: function (value) {
                    if (this.components.play) {
                        this.components.play.playing = !!value;
                    }
                },
				get: function () {
					return this.components.play?this.components.play.playing:false;
				}
            }
        });
    }

    ControlBar.prototype.addTrack = function(track) {
        if (this.components.captions) {
            this.components.captions.addTrack(track);
        }
    };

    ControlBar.prototype.addEventListener = function(event, callback, capture) {
        this.element.addEventListener(event, callback, !!capture);
    };
	
    ControlBar.prototype.removeEventListener = function(event, callback, capture) {
        this.element.removeEventListener(event, callback, !!capture);
    };

    Ayamel.classes.ControlBar = ControlBar;
}(Ayamel));