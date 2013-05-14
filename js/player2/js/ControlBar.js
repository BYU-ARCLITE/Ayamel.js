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
			parent: this,
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

		//set default values
		this.currentTime = 0;
		this.duration = 0;
		this.volume = 0;
		this.muted = false;
		this.playbackRate = 0;
		this.playing = false;
		this.fullScreen = false;
		
        // Create the control bar components
        this.components = components;

        if(controlLists.left instanceof Array){
			controlLists.left.forEach(addComponent.bind(this,$element.children(".leftControls")));
		}
        if(controlLists.right instanceof Array){
			controlLists.right.forEach(addComponent.bind(this,$element.children(".rightControls")));
		}
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