(function(Ayamel) {
	"use strict";

	function renderEmptySidebar(sidebar){
		var result = document.createElement('div');
		result.className = 'sidebar';
		if(sidebar.side === 'left'){
			result.classList.add('leftBar');
		}else if(sidebar.side === 'right'){
			result.classList.add('rightBar');
		}
		result.classList.add(sidebar.visible?'visible':'invisible');
		return result;
	}

	function renderEmptyTabList(){
		var result = document.createElement('ul');
		result.className = 'sidebarHeads';
		return result;
	}

	function renderEmptyHead(){
		var result = document.createElement('nav');
		result.className = 'sidebarNav';
		return result;
	}

	function renderEmptyBody(){
		var result = document.createElement('div');
		result.className = 'tabContent';
		return result;
	}

	function renderHideButton(sidebar){
		var result = document.createElement('span');
		result.className = 'hideButton';
		result.classList.add('fa');

		if(sidebar.side === 'right') {
			result.classList.add('fa-chevron-right');
			result.classList.add('icon-chevron-right');
		}else if(sidebar.side === 'left') {
			result.classList.add('fa-chevron-left');
			result.classList.add('icon-chevron-left');
		}

		result.addEventListener('click', function(){ sidebar.hide(); });
		return result;
	}

	function renderTabs(sidebar, headList, sidebarBody){
		sidebar.tabs.forEach(function(tab){
			headList.appendChild(tab.head);
			sidebarBody.appendChild(tab.body);
			if(sidebar.selected === tab){
				sidebar.selectTab(tab);
			}
		});
	}

	function render(sidebar){
		var result = renderEmptySidebar(sidebar),
			head = renderEmptyHead(),
			headList = renderEmptyTabList(),
			body = renderEmptyBody(),
			hideButton = renderHideButton(sidebar);
		result.appendChild(head);
		head.appendChild(headList);
		body.appendChild(hideButton);
		result.appendChild(body);
		renderTabs(sidebar, headList, body);
		return result;
	}

	function Sidebar(args) {
		var tabs, that = this;

		tabs = args.tabs.map(function(tdata){
			return new Ayamel.classes.SidebarTab({
				title: tdata.title,
				content: tdata.content,
				sidebar: that
			});
		});

		this.player = args.player;
		this.side = args.side;
		this.visible = !!args.visible;

		this.tabs = tabs;
		this.selected = tabs.filter(function(_, i){
			return args.tabs[i].selected;
		})[0] || tabs[0];

		this.element = render(this);
		args.holder.appendChild(this.element);
	}

	Sidebar.prototype = {
		selectTab: function(tab){
			if(this.selectedTab){
				if(this.selectedTab === tab){ return; }
				this.selectedTab.deselect();
			}
			tab.select();
			this.selectedTab = tab;
		},
		hide: function(){
			if(!this.visible){ return; }
			this.visible = false;
			this.element.classList.remove('visible');
			this.element.className += ' invisible';
			this.deselectAll();
			this.player.resetSize();
		},
		show: function(){
			if(this.visible){ return; }
			this.visible = true;
			this.element.classList.remove('invisible');
			this.element.classList.add('visible');
			this.player.resetSize();
		},
		toggle: function() {
			if(this.visible){ this.hide(); }
			else{ this.show(); }
		},
		deselectAll: function() {
			this.selectedTab = null;
			this.tabs.forEach(function(t){ t.deselect(); });
		},
		get offsetWidth(){
			return this.visible?this.element.offsetWidth:0;
		},
		get offsetHeight(){
			return this.visible?this.element.offsetHeight:0;
		}
	};

	Ayamel.classes.Sidebar = Sidebar;

}(Ayamel));