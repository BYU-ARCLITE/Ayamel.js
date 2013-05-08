(function(Ayamel) {
    "use strict";

    var template =
        '<div class="controlBar">\
            <div class="leftControls"></div>\
            <div class="rightControls"></div>\
        </div>';

	function addComponent($controls, component) {
		var constructor = Ayamel.controls[component];
		if(typeof constructor !== 'function'){ return; }
		this.components[component] = new constructor({
			$holder: $controls
		});
	}
	
    function ControlBar(args) {
        var _this = this,
			controlLists = args.components || {left:["play", "volume", "captions"], right:["rate", "fullScreen", "timeCode"]},
			components = {},
			$element = $(template);

        // Create the element
        this.$element = $element;
		this.element = $element[0];
        args.$holder.append(this.$element);

        // Create the control bar components
        this.components = components;

        if(controlLists.left instanceof Array){
			controlLists.left.forEach(addComponent.bind(this,$element.children(".leftControls")));
		}
        if(controlLists.right instanceof Array){
			controlLists.right.forEach(addComponent.bind(this,$element.children(".rightControls")));
		}

        Object.defineProperties(this, {
            currentTime: {
				enumerable: true,
                set: function (value) {
                    if (components.timeCode) {
                        components.timeCode.currentTime = value;
                    }
                },
				get: function () {
					return components.timeCode?components.timeCode.currentTime:0;
				}
            },
            duration: {
				enumerable: true,
                set: function (value) {
                    if (components.timeCode) {
                        components.timeCode.duration = value;
                    }
                },
				get: function () {
					return components.timeCode?components.timeCode.duration:0;
				}
            },
            fullScreen: {
				enumerable: true,
                set: function (value) {
                    if (components.fullScreen) {
                        components.fullScreen.fullScreen = !!value;
                    }
                },
				get: function () {
					return components.fullScreen?components.fullScreen.fullScreen:false;
				}
            },
            playing: {
				enumerable: true,
                set: function (value) {
                    if (components.play) {
                        components.play.playing = !!value;
                    }
                },
				get: function () {
					return components.play?components.play.playing:false;
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