/**
 * ControlBar.js
 * This is an alternate control bar.
 * Instead of MediaControls.js include
 * <ol>
 *     <li>ProgressBar.js</li>
 *     <li>ControlBar.js</li>
 * </ol>
 *
 * Requires
 *  - JQuery
 *  - ProgressBar.js
 * Used by
 *  - MediaController.js
 */
var ControlBar = (function () {
    "use strict";

    // Templates for the control bar and component holder
    var template = document.createElement('div'),
        componentHolderTemplate = document.createElement('div');

	template.className = "controlBar";
	componentHolderTemplate.className = "components";
	
    /**
     * The Control Bar object.
     * @constructor
     */
    function ControlBar(attributes,componentNames) {
        var _this = this, components = {},
			progressBar = new ProgressBar(this),
            element = template.cloneNode(false),
            componentHolder = componentHolderTemplate.cloneNode(false),
			clist = (componentNames || []) // Turn the list of names into actual components
				.filter(function(name){ return typeof ControlBarComponents[name] === 'function'; })
				.map(function(name){ return ControlBarComponents[name](_this, attributes); });

        // Add the progress bar
        element.appendChild(progressBar.element);

        // Add the components
        element.appendChild(componentHolder);
        clist.forEach(function(component){
			components[component.name] = component;
            componentHolder.appendChild(component.element);
        });

		this.progressBar = progressBar;
		this.components = components;
		this.element = element;
    }
	
	Object.defineProperties(ControlBar.prototype, {
		duration: {
			set: function(value){ this.progressBar.duration = value; },
			get: function(){ return this.progressBar.duration; }
		},
		muted: {
			set: function(value){
				var volume = this.components.volume;
				if(volume){ return volume.muted = value; }
				return false;
			},
			get: function(){
				var volume = this.components.volume;
				return volume?volume.muted:false;
			}
		},
		playing: {
			set: function(value){
				var play = this.components.play;
				if(play){ return play.playing = value; }
				return false;
			},
			get: function(){
				var play = this.components.play;
				return play?play.playing:false;
			}
		},
		progress: {
			set: function(value){ return this.progressBar.progress = value; },
			get: function(){ return this.progressBar.progress; }
		},
		volume: {
			set: function (value) {
				var volume = this.components.volume;
				if(volume){ return volume.volume = value; }
				return 100;
			},
			get: function () {
				var volume = this.components.volume;
				return volume?volume.volume:100;
			}
		}
	});

    ControlBar.prototype.addEventListener = function (eventName, callback) {
        this.element.addEventListener(eventName, callback, false);
    };
    ControlBar.prototype.removeEventListener = function (eventName, callback) {
        this.element.removeEventListener(eventName, callback, false);
    };
    ControlBar.prototype.getComponent = function(name) {
        return this.components[name]||null;
    };

    return ControlBar;

}());