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
        sidebar.tabs.forEach(function(tab) {
            var tabHead = tab.head;
            var callback = function(e) {
                var myTab = tab;
                if(!sidebar.visible) {
                    sidebar.show();
                }
                if(sidebar.selectedTab !== tab) {
                    sidebar.selectTab(myTab);
                }
            };
            tabHead.addEventListener('click', callback);
            headList.appendChild(tabHead);
            var tabBody = tab.body;
            body.appendChild(tabBody);
            if(sidebar.selected === tab) {
                sidebar.selectTab(tab);
            }
        });
        return result;
    }

    function renderHideButton(sidebar) {
        var result = document.createElement('div');
        result.className = 'hideButton';
        var callback = function(e) {
            console.log('clicked hide button');
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