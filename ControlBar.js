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
    var template = '<div class="controlBar"></div>',
        componentHolderTemplate = '<div class="components"></div>';

    // A helper function to help find and work with components
    function getComponent(components, name) {
        var validComponents = components.filter(function (component) {
            return component.name === name;
        });
        if (validComponents.length > 0) {
            return validComponents[0];
        }
        return null;
    }

    /**
     * The Control Bar object.
     * @constructor
     */
    function ControlBar(attributes) {
        var self = this,

            // The progress bar object
            progressBar = new ProgressBar(self),

            // If no components are defined, then use a default set
            componentNames = attributes.componentNames || ["play", "volume"],

            // Turn the list of names into actual components
            components = componentNames.map(function (name) {
                return ControlBarComponents[name](self, attributes);
            }),

            // Create the element
            $element = $(template),

            // Create the component holder
            $componentHolder = $(componentHolderTemplate);

        // Add the progress bar
        $element.append(progressBar.element);

        // Add the components
        $element.append($componentHolder);
        components.forEach(function (component) {
            $componentHolder.append(component.element);
        });

        //Define properties for this object
        Object.defineProperties(this, {
            captionElement: {
                get: function () {
                    var captions = getComponent(components, "captions");
                    if (captions) {
                        return captions.element;
                    }
                    return null;
                }
            },
            duration: {
                set: function (value) {
                    progressBar.duration = value;
                },
                get: function () {
                    return progressBar.duration;
                }
            },
            element: {
                get: function () {
                    return $element.get(0);
                }
            },
            muted: {
                set: function (value) {
                    var volume = getComponent(components, "volume");
                    if (volume) {
                        volume.muted = value;
                    }
                },
                get: function () {
                    var volume = getComponent(components, "volume");
                    if (volume) {
                        return volume.muted;
                    }
                    return false;
                }
            },
            playing: {
                get: function () {
                    var play = getComponent(components, "play");
                    if (play) {
                        return play.playing;
                    }
                    return false;
                },
                set: function (value) {
                    var play = getComponent(components, "play");
                    if (play) {
                        play.playing = value;
                    }
                }
            },
            progress: {
                set: function (value) {
                    progressBar.progress = value;
                },
                get: function () {
                    return progressBar.progress;
                }
            },
            volume: {
                set: function (value) {
                    var volume = getComponent(components, "volume");
                    if (volume) {
                        volume.volume = value;
                    }
                },
                get: function () {
                    var volume = getComponent(components, "volume");
                    if (volume) {
                        return volume.volume;
                    }
                    return 100;
                }
            }
        });
    }

    // Define the prototype with event adders/removers
    ControlBar.prototype = {
        addEventListener: function (eventName, callback) {
            this.element.addEventListener(eventName, callback, false);
        },
        removeEventListener: function (eventName, callback) {
            this.element.removeEventListener(eventName, callback, false);
        }
    };

    return ControlBar;

}());