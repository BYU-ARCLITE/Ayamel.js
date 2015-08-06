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
		if(sidebar.visible){
			result.classList.add('visible');
		}
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

	function renderTabs(sidebar, headList, sidebarBody){
		sidebar.tabs.forEach(function(tab){
			headList.appendChild(tab.head);
			sidebarBody.appendChild(tab.body);
			if(sidebar.selected === tab){
				sidebar._userSelectTab(tab);
			}
		});
	}

	function render(sidebar){
		var result = renderEmptySidebar(sidebar),
			head = renderEmptyHead(),
			headList = renderEmptyTabList(),
			body = renderEmptyBody();
		result.appendChild(head);
		head.appendChild(headList);
		result.appendChild(body);
		renderTabs(sidebar, headList, body);
		return result;
	}

	function deselectAll(sidebar){
		this.selectedTab = null;
		this.tabs.forEach(function(t){ t.deselect(); });
	}

	function showSidebar(sidebar){
		if(sidebar.visible){ return; }
		sidebar.visible = true;
		sidebar.element.classList.add('visible');
		sidebar.player.resetSize();
	}

	function Sidebar(args) {
		var tabs, that = this;

		tabs = args.tabs.map(function(tdata){
			return new Ayamel.classes.SidebarTab({
				title: tdata.title,
				content: tdata.content,
				player: args.player,
				sidebar: that
			});
		});

		this.player = args.player;
		this.side = args.side;

		this.tabs = tabs;
		this.selectedTab = tabs.filter(function(_, i){
			return args.tabs[i].selected;
		})[0] || null;
		this.baseTab = this.selectedTab;

		this.visible = !!this.selectedTab;
		this.baseVisible = this.visible;

		this.element = render(this);
		args.holder.appendChild(this.element);
	}

	Sidebar.prototype = {
		show: function(tab){
			if(typeof tab === 'undefined'){
				showSidebar(this);
			} else {
				this.selectTab(tab);
			}
		},
		hide: function(){
			if(!this.visible){ return; }
			this.visible = false;
			this.element.classList.remove('visible');
			deselectAll(this);
			this.player.resetSize();
		},
		selectTab: function(tab){
			var oldTab = this.selectedTab;
			if(oldTab === tab){ return; }
			this.selectedTab = tab;
			if(oldTab){ oldTab.deselect(); }
			else{ showSidebar(this); }
		},
		restore: function(){
			if(this.baseVisible){
				this.selectTab(this.baseTab);
			} else {
				this.hide();
			}
		},
		_userShow: function(){
			this.baseVisible = true;
			this.show();
		},
		_userHide: function(){
			this.baseVisible = false;
			this.hide();
		},
		_userSelectTab: function(tab) {
			this.baseTab = tab;
			this.selectTab(tab);
		},
		_deselectTab: function(tab){
			if(this.selectedTab !== tab){ return; }
			this.hide();
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