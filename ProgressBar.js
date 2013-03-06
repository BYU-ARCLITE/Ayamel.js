/**
 * ProgressBar.js
 * The progress bar is part of the media controls and represents the progress of the media being played.
 *
 * Requires:
 *  - JQuery
 * Used by:
 *  - MediaControls2.js
 */
var ProgressBar = (function () {
    "use strict";

    var template =
        '<div class="timeBar">' +
        '    <div class="progressBar"></div><div class="progressKnob"></div>' +
        '</div>';

    /**
     * The Progress Bar object. This is used to keep track of the time progress.
     * This contains the following properties:
     * <ul>
     *     <li>duration (get/set) - The length, in seconds, of the media being represented.</li>
     *     <li>element (get) - The HTML element which is depicting the progress</li>
     *     <li>progress (get/set) - The current position, in seconds, of the media.</li>
     * </ul>
     * @constructor
     */
    function ProgressBar(controlBar) {
        var duration = 0,
            progress = 0,
            $element = $(template), // Create the HTML element
            $knob = $element.children(".progressKnob"),
            moving = false;

        // Add click functionality
        $knob.bind("touchstart mousedown", function (event) {
            moving = true;
            event.stopPropagation();
        });

        $(document)
            .bind("touchmove mousemove", function (event) {
                if (moving) {
                    var width = event.pageX - $element.offset().left;
                    $element.children(".progressBar").width(width);
                }
            }).bind("touchend mouseup", function (event) {
                if (moving) {
                    moving = false;

                    var percentage = $element.children(".progressBar").width() / $element.width(),
                        newEvent;

                    // Create a new event and dispatch it through the control bar
                    newEvent = document.createEvent('HTMLEvents');
                    newEvent.initEvent('progressupdate',true,true);
                    newEvent.progress = progress = percentage * duration;
                    controlBar.element.dispatchEvent(newEvent);

                    console.log(progress);

                    // Prevent the parent element from handling the event
                    event.stopPropagation();
                }
            });

        $element.bind("touchend mouseup", function (event) {
            console.log("click");
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
            newEvent.initEvent('progressupdate',true,true);
            newEvent.progress = progress = percentage * duration;
            controlBar.element.dispatchEvent(newEvent);
        });

        Object.defineProperties(this, {
            duration: {
                get: function () {
                    return duration;
                },
                set: function (value) {
                    duration = Number(value);
                }
            },
            element: {
                get: function () {
                    return $element.get(0);
                }
            },
            progress: {
                get: function () {
                    return progress;
                },
                set: function (value) {
                    var width;

                    // Set the progress bounding it between 0 and the duration
                    progress = Math.max(Math.min(value, duration), 0);

                    // Set the width of the progress bar if not dragging it
                    if (!moving) {
                        width = (duration ? progress / duration : 0) * 100;
                        $element.find(".progressBar").width(width + "%");
                    }
                }
            }
        });
    }

    return ProgressBar;
}());