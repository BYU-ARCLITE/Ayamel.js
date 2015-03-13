(function(Ayamel) {
    "use strict";

    var template = '<span class="control">\
		<div class="button lastCaption" title="jump to previous cue"></div>\
		<div class="button nextCaption" title="jump to following cue"></div>\
	</span>';

    function LastCaptionButton(args) {
        var _this = this,
            element = Ayamel.utils.parseHTML(template);

        this.element = element;
        args.holder.appendChild(element);

        // Set up events
        element.querySelector('.lastCaption').addEventListener('click',function (e) {
            e.stopPropagation();
            element.dispatchEvent(new CustomEvent('captionJump',{bubbles:true,cancelable:true,detail:{direction:"back"}}));
        },false);
        element.querySelector('.nextCaption').addEventListener('click',function (e) {
            e.stopPropagation();
            element.dispatchEvent(new CustomEvent('captionJump',{bubbles:true,cancelable:true,detail:{direction:"forward"}}));
        },false);
    }

    Ayamel.controls.lastCaption = LastCaptionButton;
}(Ayamel));