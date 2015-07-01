(function(Ayamel) {
	"use strict";

	function renderHead(name) {
        var result = document.createElement('li');
        result.classList.add('tabHead');
        result.classList.add('unselected');
        var headDiv = document.createElement('div');
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

	function initCallbacks(tab, onClickTabInit) {
		var callbacks = [];
		if(typeof onClickTabInit === 'function') {
			callbacks.push(onClickTabInit);
		}
		tab.clickTabCallbacks = callbacks;
		tab.onClickTabInit = onClickTabInit;
		function clickTabCallback() {
			for(var i = 0; i < callbacks.length; i++) {
				var callback = callbacks[i];
				callback();
			}
		}
		tab.head.addEventListener('click', clickTabCallback);
	}
	
	function SidebarTab(args) {
		var	that = this,
			title = args.title,
			onClickTab = args.onClickTab,
			content = args.content;

		this.title = title;
		this.content = content;
		this.head = renderHead(title);
		this.body = renderBody(title, content);

		initCallbacks(this, onClickTab);
	}

	SidebarTab.prototype = {
		select: function() {
			this.body.classList.remove('hidden');
			this.body.classList.add('visible');
			this.head.classList.remove('unselected');
			this.head.classList.add('selected');
		},
		deselect: function() {
			this.body.classList.remove('visible');
			this.body.classList.add('hidden');
			this.head.classList.remove('selected');
			this.head.classList.add('unselected');
		},
		clone: function() {
			return new SidebarTab({
				title: this.title,
				content: this.content.cloneNode(true),
				onClickTab: this.onClickTabInit
			});
		},
		onClickTab: function(callback) {
			this.clickTabCallbacks.push(callback);
		}
	}

	Ayamel.classes.SidebarTab = SidebarTab;

}(Ayamel));