(function(Ayamel) {
	"use strict";

	function renderHead(name) {
        var result = document.createElement('li');
        result.classList.add('tabHead');
        result.classList.add('unselected');
        result.textContent = name;
        return result;
	}

	function renderBody(name, content) {
		var result = document.createElement('div');
		result.className = 'tabBody';
		result.id = name;
		result.appendChild(content);
		result.classList.add('hidden');
		return result;
	}
	
	function SidebarTab(args) {
		var	that = this,
			title = args.title,
			onClickTab = args.onClickTab,
			content = args.content;

		this.title = title;
		this.content = content;
		this.head = renderHead(title);
		var clickCallback = function(e) {
			if(typeof onClickTab === 'function') {
				onClickTab(name);
			}
		};
		this.head.addEventListener('click', clickCallback);
		this.body = renderBody(title, content);

		this.clone = function() {
			return new SidebarTab({
				title: title,
				content: content.cloneNode(true),
				onClickTab: onClickTab
			});
		};

		this.select = function() {
			this.body.classList.remove('hidden');
			this.body.classList.add('visible');
			this.head.classList.remove('unselected');
			this.head.classList.add('selected');
		};

		this.deselect = function() {
			this.body.classList.remove('visible');
			this.body.classList.add('hidden');
			this.head.classList.remove('selected');
			this.head.classList.add('unselected');
		};

	}

	SidebarTab.prototype = {

	}

	Ayamel.classes.SidebarTab = SidebarTab;

}(Ayamel));