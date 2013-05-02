/**
 * ControlBarComponents.js
 * This creates various components that can be added to a ControlBar.
 *
 * Requires
 *  - JQuery
 * Used by
 *  - ControlBar.js
 */
var ControlBarComponents = (function () {
    "use strict";

    // Define all the templates in one place
    var templates = {
        captions:   '<div class="captions">' +
                    '    <div class="captionsIcon"></div>' +
                    '    <div class="captionsMenu">' +
                    '        <div class="captionsMenuTipDark"></div>' +
                    '        <div class="captionsMenuTip"></div>' +
                    '    </div>' +
                    '</div>',
        captionMenuEntry:   '<div class="captionsMenuEntry"></div>',
        fullScreen: '<div class="fullScreen"></div>',
        play:       '<div class="play"></div>',
    };

    /**
     * The Captions component
     * This contains the following properties:
     * <ul>
     *     <li>element (get) - The HTML element for this component</li>
     *     <li>name (get) - The name of this component type</li>
     * </ul>
     * @constructor
     */
    function CaptionsComponent(controlBar, attributes) {
        var $element = $(templates.captions);
		
		this.name = "captions";
		this.element = $element.get(0);
        this.tracks = [];

        // Set up the menu
        $element.children(".captionsIcon").click(function (event) {
            $element.children(".captionsMenu").toggle();
            event.stopPropagation();
        });
        $element.click(function (event) {
            event.stopPropagation();
        });
        $(document).click(function () {
            $element.children(".captionsMenu").hide();
        });
    }
    CaptionsComponent.prototype.addTrack = function addTrack(track) {
        var _this = this,
            $element = $(this.element),
            $entry;

        this.tracks.push(track);

        // Add an entry
        $element.children(".captionsMenu").append(templates.captionMenuEntry);

        // Add the text and set as active if applicable
        $entry = $element.find(".captionsMenuEntry:last-child").append(track.label);
        if (track.mode === "showing") {
            $entry.addClass("active");
        }

        // Add click functionality
        $entry.click(function () {

            // Toggle this track
            if (track.mode === "showing") {
                track.mode  = "disabled";
                $entry.removeClass("active");
            } else {
                track.mode  = "showing";
                $entry.addClass("active");
            }
        });
    };

    /**
     * The FullScreen component
     * This contains the following properties:
     * <ul>
     *     <li>element (get) - The HTML element for this component</li>
     *     <li>name (get) - The name of this component type</li>
     * </ul>
     * @constructor
     */
    function FullScreenComponent(controlBar, attributes) {
        var $element = $(templates.fullScreen);
		
		this.name = "fullScreen";
        this.element = $element.get(0);
        $element.click(function (event) {
            if (event.button !== 0) {
                return;
            }
            
            // Create a new event and dispatch it through the control bar
			var newEvent = document.createEvent('HTMLEvents');
			newEvent.initEvent("fullscreen", true, true);
			controlBar.element.dispatchEvent(newEvent);
        });
    }

    /**
     * The Play/Pause component. Clicking plays/pauses the media.
     * This contains the following properties:
     * <ul>
     *     <li>element (get) - The HTML element for this component</li>
     *     <li>name (get) - The name of this component type</li>
     *     <li>playing (set) - Sets the playing/paused icon</li>
     * </ul>
     * @constructor
     */
    function PlayComponent(controlBar, attributes) {
        var $element = $(templates.play),
            playing = attributes.playing || false;

		this.name = "play";
        this.element = $element.get(0);
		
        // Set up the click functionality
        $element.click(function (event) {
            if (event.button !== 0) {
                return;
            }

            // Create a new event and dispatch it through the control bar
            var newEvent = document.createEvent('HTMLEvents');
            newEvent.initEvent(controlBar.playing ? 'pause' : 'play', true, true);
            controlBar.element.dispatchEvent(newEvent);
        });

        Object.defineProperties(this, {
            playing: {
                get: function () {
                    return playing;
                },
                set: function (value) {
                    playing = value;

                    if (playing) {
                        $element.addClass("playing");
                    } else {
                        $element.removeClass("playing");
                    }
                }
            }
        });
    }

	function ProgBar(color){
		var bar_c = document.createElement('div'),
			bar_m = bar_c.cloneNode(false),
			bar_p = bar_c.cloneNode(false);
		
		bar_p.className = "progress_tiny "+color;
		bar_p.style.width = "0%";
		bar_m.className = "mortice_tiny";
		bar_m.appendChild(bar_p);
		bar_c.className = "container_tiny";
		bar_c.appendChild(bar_m);
		bar_c.style.pointerEvents = "auto";
		this.element = bar_c;
		Object.defineProperty(this,"width",{
			set: function(val){bar_p.style.width = val;},
			get: function(){return bar_p.style.width;}
		});
	}
	
	ProgBar.prototype = {
		addEventListener: function(ename,cb){
			this.element.addEventListener(ename,cb,false);
		},
		removeEventListener: function(ename,cb){
			this.element.removeEventListener(ename,cb,false);
		},
		percent: function(pixels){
			return pixels / parseInt(this.element.offsetWidth,10);
		}
	};
	
    /**
     * The Volume/Mute component
     * This contains the following properties:
     * <ul>
     *     <li>element (get) - The HTML element for this component</li>
     *     <li>name (get) - The name of this component type</li>
     * </ul>
     * @constructor
     */
    function VolumeComponent(controlBar, attributes) {
        var element = document.createElement('div'),
			icon = document.createElement('div'),
			slider = new ProgBar("green"),
            volume, muted;
		
		element.className = "volume";
		icon.className = "icon";
		element.appendChild(icon);
		element.appendChild(slider.element);
		element.style.pointerEvents = "auto";
		
        icon.addEventListener('click',function(event){
            if (event.button !== 0) { return; }
            // Create a new event and dispatch it through the control bar
            var newEvent = document.createEvent('HTMLEvents');
            newEvent.initEvent("mutechange", true, true);
            newEvent.muted = !muted;
            controlBar.element.dispatchEvent(newEvent);
        },false);
		
		slider.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var pc = slider.percent(e.offsetX || e.layerX),
				newe = document.createEvent('HTMLEvents');
			slider.width = (100 * pc) + "%";
			newe.initEvent('volumechange',true,true);
			newe.volume = 100 * pc;
			controlBar.element.dispatchEvent(newe);
		},false);

        Object.defineProperties(this, {
			element: { value: element },
			name: { value: "volume" },
            muted: {
                get: function () { return muted; },
                set: function (value) {
                    muted = Boolean(value);

                    if (muted) {
                        element.classList.add("muted");
                    } else {
                        element.classList.remove("muted");
                    }
                }
            },
            volume: {
                get: function () { return volume; },
                set: function (value) {
                    volume = Math.max(Math.min(Number(value), 100), 0);
                    slider.width = volume + "%";
                }
            }
        });
		
		this.volume = attributes.volume || 100;
		this.muted = attributes.muted || false;
    }
	
	function SpeedComponent(controlBar, attributes){
		var element = document.createElement('div'),
			icon = document.createElement('div'),
			slider = new ProgBar("green"),
			rate;
		
		element.className = "playrate";
		icon.className = "icon";
		element.appendChild(icon);
		element.appendChild(slider.element);
		element.style.pointerEvents = "auto";
		
		icon.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var newe = document.createEvent('HTMLEvents');
			newe.initEvent("ratereset",true,true);
			controlBar.element.dispatchEvent(newe);
		},false);
		
		slider.addEventListener('click',function(e){
			if(e.button !== 0){return;}
			var pc = slider.percent(e.offsetX || e.layerX),
				newe = document.createEvent('HTMLEvents');
			slider.width = (100 * pc) + "%";
			newe.initEvent('ratechange',true,true);
			newe.rate = pc * 2;
			controlBar.element.dispatchEvent(newe);
		},false);
		
		Object.defineProperties(this,{
			element: {value: element},
			name: {value: "speed"},
			rate: {
				get: function(){return rate;},
				set: function(val){
					rate = (val<=2?(val>=0?val:0):2);
					slider.width = (100*rate/2)+'%';
				}
			}
		});
		this.rate = attributes.rate || 1;
	}

	
    return {
        captions: function (controlBar, attributes) {
            return new CaptionsComponent(controlBar, attributes);
        },
        fullScreen: function (controlBar, attributes) {
            return new FullScreenComponent(controlBar, attributes);
        },
        play: function (controlBar, attributes) {
            return new PlayComponent(controlBar, attributes);
        },
        volume: function (controlBar, attributes) {
            return new VolumeComponent(controlBar, attributes);
        },
        speed: function (controlBar, attributes) {
            return new SpeedComponent(controlBar, attributes);
        }
    };
}());