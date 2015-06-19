(function(Ayamel) {
	"use strict";

    function renderContainer(sidebar, side) {
        var result = document.createElement('div');
        result.className = 'sidebar';
        if(side === 'left') {
            result.className += ' leftBar';
        }
        else if(side === 'right') {
            result.className += ' rightBar'
        }
        var toggleTab = renderToggleTab(sidebar);
        result.appendChild(toggleTab);
        return result;
    }

    function render(tabs, sidebar) {
        var result = document.createElement('div');
        result.className = 'sidebarContent';
    	var head = renderEmptyHead(tabs);
        result.appendChild(head);
        var body = renderEmptyBody(tabs);
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

    function renderEmptyHead(tabs) {
        var headsStr = '<ul class="nav nav-tabs" id="videoTabs"></ul>';
        var result = Ayamel.utils.parseHTML(headsStr);
        return result;
    }

    function renderEmptyBody(tabs) {
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
            visibleInit = args.visible,
            onToggleInit = args.onToggle || undefined,
            tabNames = args.tabs;

        var toggleCallbacks = [];
        if(typeof onToggleInit !== undefined) {
            toggleCallbacks.push(onToggleInit);
        }

        var visible;

        var tabs = Ayamel.TabGenerator.generateTabs(tabNames);
        window.tabs = tabs;

        var element = renderContainer(this, side);

        var content = render(tabs, this);
        element.appendChild(content);
        this.element = element;

        element.style.width = 0;
        content.style.display = 'none';

        this.toggle = function() {
            if(element.style.width === '0px') {
                this.visible = true;
            }
            else {
                this.visible = false;
            }
            toggleCallback(toggleCallbacks);
        };

        this.onToggle = function(callback) {
            toggleCallbacks.push(callback);
        };

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
            },
            visible: {
                get: function() {
                    return visible;
                },
                set: function(trueOrFalse) {
                    if(trueOrFalse === true) {
                        element.style.width = '';
                        content.style.display = '';
                        visible = true;
                    }
                    else if(trueOrFalse === false) {
                        element.style.width = 0;
                        content.style.display = 'none';
                        visible = false;
                    }
                }
            }
        });

        this.visible = visibleInit;

        holder.appendChild(element);
    }

    Sidebar.prototype = {
        selectTab: function(key) {
            var tab = this.tabs[key];
            tab.select();
        }
    };

    Ayamel.classes.Sidebar = Sidebar;

}(Ayamel));