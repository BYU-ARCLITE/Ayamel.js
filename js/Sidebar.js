(function(Ayamel) {
	"use strict";

    function render(tabs, side, visible) {
        var result = renderEmptySidebar(side, visible);
        var head = renderEmptyHead();
        result.appendChild(head);
        var body = renderEmptyBody();
        result.appendChild(body);
        for(var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            var tabHead = tab.head;
            var tabBody = tab.body;
            head.appendChild(tabHead);
            body.appendChild(tabBody);
        }
        return result;
    }

    function renderEmptySidebar(side, visible) {
        var result = document.createElement('div');
        result.className = 'sidebar';
        if(side === 'left') {
            result.className += ' leftBar';
        }
        else if(side === 'right') {
            result.className += ' rightBar'
        }
        if(visible === true) {
            result.className += ' visible';
        }
        else if(visible === false) {
            result.className += ' invisible';
        }
        return result;
    }

    function renderEmptyHead() {
        var headsStr = '<ul class="nav nav-tabs" id="videoTabs"></ul>';
        var result = Ayamel.utils.parseHTML(headsStr);
        return result;
    }

    function renderEmptyBody() {
    	var contentsStr = '<div class="tab-content"></div>';
    	var result = Ayamel.utils.parseHTML(contentsStr);
        return result;
    }

    function renderToggleTab(sidebar) {
        var result = document.createElement('div');
        result.className = 'toggle-tab';
        result.addEventListener('click', function(e) {
            sidebar.toggle();
        });
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
            onToggleInit = args.onToggle || undefined,
            tabNames = args.tabs,
            selectedTab = args.selected || '';

        var toggleCallbacks = [];
        var tabs = Ayamel.TabGenerator.generateTabs({
            tabNames: tabNames,
            onClickTab: function(name) {
                if(name === selectedTab || !visible) {
                    that.toggle();
                }
                selectedTab = name;
            }
        });
        var element = render(tabs, side, visible);

        this.toggle = function() {
            if(visible) {
                element.classList.remove('visible');
                element.className += ' invisible';
                visible = false;
            }
            else {
                element.classList.remove('invisible');
                element.classList.add('visible');
                visible = true;
            }
            toggleCallback(toggleCallbacks);
        };

        this.onToggle = function(callback) {
            toggleCallbacks.push(callback);
        };

        this.selectTab = function(key) {
            var tab = this.tabs[key];
            tab.select();
        }

        Object.defineProperties(this, {
            offsetWidth: {
                get: function() {
                    return element.offsetWidth;
                }
            },
            offsetHeight: {
                get: function() {
                    return element.offsetHeight;
                }
            }
        });

        holder.appendChild(element);
        if(typeof onToggleInit !== undefined) {
            toggleCallbacks.push(onToggleInit);
        }

    }

    Ayamel.classes.Sidebar = Sidebar;

}(Ayamel));