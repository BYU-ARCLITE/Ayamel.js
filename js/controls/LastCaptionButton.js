/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template = '<div class="control button lastCaption"></div>';

    function LastCaptionButton(args) {
        var _this = this,
            $element = $(template),
			element = $element[0];

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        // Set up events
        element.addEventListener('click',function (e) {
            e.stopPropagation();
            element.dispatchEvent(new CustomEvent('captionJump',{bubbles:true,cancelable:true,detail:{direction:"back"}}));
        },false);
    }

    Ayamel.controls.lastCaption = LastCaptionButton;
}(Ayamel));