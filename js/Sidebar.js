(function(Ayamel) {
	"use strict";

    function render(sidebar) {
        var result = renderEmptySidebar(sidebar);
        var head = renderEmptyHead();
        result.appendChild(head);
        var headList = renderEmptyTabList();
        head.appendChild(headList);
        var body = renderEmptyBody();
        var hideButton = renderHideButton(sidebar);
        body.appendChild(hideButton);
        result.appendChild(body);
        renderTabs(sidebar, headList, body);
        return result;
    }

    function renderTabs(sidebar, headList, body) {
        var tabs = sidebar.tabs;
        for(var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            renderTab(tab, sidebar, headList, body);
        }
    }

    function renderTab(tab, sidebar, headList, sidebarBody) {
            tab.onClickTab(function() {
                if(!sidebar.visible) {
                sidebar.show();
            }
            if(sidebar.selectedTab !== tab) {
                sidebar.selectTab(tab);
            }
        });
        var head = tab.head;
        headList.appendChild(head);
        var tabBody = tab.body;
        sidebarBody.appendChild(tabBody);
        if(sidebar.selected === tab) {
            sidebar.selectTab(tab);
        }
    }

    function renderHideButton(sidebar) {
        var result = document.createElement('span');
        result.className = 'hideButton';
        result.classList.add('fa');
        if(sidebar.side === 'right') {
            result.classList.add('fa-chevron-right');
        }
        else if(sidebar.side === 'left') {
            result.classList.add('fa-chevron-left');
        }
        var callback = function() {
            sidebar.hide();
        }
        result.addEventListener('click', callback);
        return result;
    }

    function renderEmptySidebar(sidebar) {
        var result = document.createElement('div');
        result.className = 'sidebar';
        if(sidebar.side === 'left') {
            result.className += ' leftBar';
        }
        else if(sidebar.side === 'right') {
            result.className += ' rightBar'
        }
        if(sidebar.visible === true) {
            result.className += ' visible';
        }
        else if(sidebar.visible === false) {
            result.className += ' invisible';
        }
        return result;
    }

    function renderEmptyTabList() {
        var result = document.createElement('ul');
        result.className = 'sidebarHeads';
        return result;
    }

    function renderEmptyHead() {
        var result = document.createElement('nav');
        result.className = 'sidebarNav';
        return result;
    }

    function renderEmptyBody() {
    	var result = document.createElement('div');
        result.className = 'tabContent';
        return result;
    }

    function toggleCallback(toggleCallbacks) {
        for(var i = 0; i < toggleCallbacks.length; i++) {
            var callback = toggleCallbacks[i];
            callback();
        }
    }

    function Sidebar(args) {
        var that = this,
            holder = args.holder,
            side = args.side,
            visible = args.visible || true,
            tabs = args.tabs,
            toggleCallback = args.onToggle || undefined,
            selected = args.selected || tabs[0];

        this.toggleCallbacks = [];
        this.side = side;
        this.visible = visible;
        this.tabs = tabs;
        this.toggleCallbacks.push(toggleCallback);
        this.selected = selected;
        this.element = render(this);
        holder.appendChild(this.element);
    }

    Sidebar.prototype = {
        selectTab: function(tab) {
            if(this.selectedTab) {
                this.selectedTab.deselect();
            }
            tab.select();
            this.selectedTab = tab;
        },
        hide: function() {
            this.visible = false;
            this.element.classList.remove('visible');
            this.element.className += ' invisible';
            this.deselectAll();
            toggleCallback(this.toggleCallbacks);
        },
        show: function() {
            this.visible = true;
            this.element.classList.remove('invisible');
            this.element.classList.add('visible');
            toggleCallback(this.toggleCallbacks);
        },
        toggle: function() {
            if(this.visible) {
                this.hide();
            }
            else {
                this.show();
            }
        },
        deselectAll: function() {
            this.selectedTab = null;
            for(var i = 0; i < this.tabs.length; i++) {
                var tab = this.tabs[i];
                tab.deselect();
            }
        },
        get offsetWidth() {
            if(this.visible) {
                return this.element.offsetWidth;
            }
            else {
                return 0;
            }
        },
        get offsetHeight() {
            if(this.visible) {
                return this.element.offsetHeight;
            }
            else {
                return 0;
            }
        }
    };

    Ayamel.classes.Sidebar = Sidebar;

}(Ayamel));