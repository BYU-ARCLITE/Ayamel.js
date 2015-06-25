(function(Ayamel) {
	"use strict";

    function render(sidebar, tabs, side, visible, selected) {
        var result = renderEmptySidebar(side, visible);
        var head = renderEmptyHead();
        result.appendChild(head);
        var headList = renderEmptyTabList();
        head.appendChild(headList);
        var body = renderEmptyBody();
        result.appendChild(body);
        tabs.forEach(function(original) {
            var tab = original.clone();
            var tabHead = tab.head;
            var callback = function(e) {
                var myTab = tab;
                console.log('asdf');
                if(!sidebar.visible || sidebar.selectedTab === tab) {
                    sidebar.toggle();
                }
                if(sidebar.selectedTab !== tab) {
                    sidebar.selectTab(myTab);
                }
            };
            tabHead.addEventListener('click', callback);
            headList.appendChild(tabHead);
            var tabBody = tab.body;
            body.appendChild(tabBody);
            if(selected === original) {
                sidebar.selectTab(tab);
            }
        });
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

        this.selectTab = function(tab) {
            if(this.selectedTab) {
                this.selectedTab.deselect();
            }
            tab.select();
            this.selectedTab = tab;
        };

        var element = render(that, tabs, side, visible, selected);

        this.toggle = function() {
            if(visible) {
                visible = false;
                element.classList.remove('visible');
                element.className += ' invisible';
            }
            else {
                visible = true;
                element.classList.remove('invisible');
                element.classList.add('visible');
            }
            toggleCallback();
        };

        Object.defineProperties(this, {
            offsetWidth: {
                get: function() {
                    if(visible) {
                        return element.offsetWidth;
                    }
                    else {
                        return 0;
                    }
                }
            },
            offsetHeight: {
                get: function() {
                    if(visible) {
                        return element.offsetHeight;
                    }
                    else {
                        return 0;
                    }
                }
            },
            visible: {
                get: function() {
                    return visible;
                }
            }
        });

        holder.appendChild(element);

    }

    Sidebar.prototype = {
        
    }

    Ayamel.classes.Sidebar = Sidebar;

}(Ayamel));