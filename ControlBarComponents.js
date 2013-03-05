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
        captions:   '<div class="captions"></div>',
        fullScreen: '<div class="fullScreen"></div>',
        play:       '<div class="play"></div>',
        volume:     '<div class="volume">' +
                    '    <div class="icon"></div>' +
                    '    <div class="volumeSlider">' +
                    '        <div class="volumeLevel"></div>' +
                    '    </div>' +
                    '</div>'
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
        var $element = $(templates.captions),
            name = "captions";

        Object.defineProperties(this, {
            element: {
                get: function () {
                    return $element.get(0);
                }
            },
            name: {
                get: function () {
                    return name;
                }
            }
        });
    }

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
        var $element = $(templates.fullScreen),
            name = "fullScreen";

        Object.defineProperties(this, {
            element: {
                get: function () {
                    return $element.get(0);
                }
            },
            name: {
                get: function () {
                    return name;
                }
            }
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
            name = "play",
            playing = attributes.playing || false;

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
            element: {
                get: function () {
                    return $element.get(0);
                }
            },
            name: {
                get: function () {
                    return name;
                }
            },
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
        var $element = $(templates.volume),
            name = "volume",
            volume = attributes.volume || 100,
            muted = attributes.muted || false;

        // Add click functionality
        $element.children(".icon").click(function (event) {
            if (event.button !== 0) {
                return;
            }

            // Create a new event and dispatch it through the control bar
            var newEvent = document.createEvent('HTMLEvents');
            newEvent.initEvent("mutechange", true, true);
            newEvent.muted = !muted;
            controlBar.element.dispatchEvent(newEvent);
        });

        $element.children(".volumeSlider").click(function (event) {
            var mouseX = event.offsetX || event.layerX,
                percentage,
                newEvent;

            if (event.button !== 0) {
                return;
            }

            // Figure out the new volume level
            percentage = mouseX / $(this).width();

            // Create a new event and dispatch it through the control bar
            newEvent = document.createEvent('HTMLEvents');
            newEvent.initEvent('volumechange',true,true);
            newEvent.volume = 100 * percentage;
            controlBar.element.dispatchEvent(newEvent);
        });

        Object.defineProperties(this, {
            element: {
                get: function () {
                    return $element.get(0);
                }
            },
            muted: {
                get: function () {
                    return muted;
                },
                set: function (value) {
                    muted = Boolean(value);

                    if (muted) {
                        $element.addClass("muted");
                    } else {
                        $element.removeClass("muted");
                    }
                }
            },
            name: {
                get: function () {
                    return name;
                }
            },
            volume: {
                get: function () {
                    return volume;
                },
                set: function (value) {
                    volume = Math.max(Math.min(Number(value), 100), 0);
                    $element.find(".volumeLevel").width(value + "%");
                }
            }
        });
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
        }
    };
}());