(function(Ayamel) {
	"use strict";

	function generateTabs(tabNames) {
	    var result = {};
	    for(var i = 0; i < tabNames.length; i++) {
	    	var tabName = tabNames[i];
	    	var tabContentStr = '<div class="tab-pane" id="' + name + '"></div>';
	    	result[tabName] = Ayamel.utils.parseHTML(tabContentStr);
	    }
	    return result;
    }

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
    	var tabHeads = renderTabHeads(tabs);
        result.appendChild(tabHeads);
        var tabContents = renderTabContents(tabs);
        result.appendChild(tabContents);
        return result;
    }

    function renderTabHeads(tabs) {
        var headsStr = '<ul class="nav nav-tabs" id="videoTabs"></ul>';
        var result = Ayamel.utils.parseHTML(headsStr);
        for(var name in tabs) {
            var tabHeadStr = '<li><a href="#' + name + '">' + name + '</a></li>';
            var tabHead = Ayamel.utils.parseHTML(tabHeadStr);
            result.appendChild(tabHead);
        }
        return result;
    }

    function renderTabContents(tabs) {
    	var contentsStr = '<div class="tab-content"></div>';
    	var result = Ayamel.utils.parseHTML(contentsStr);
    	for(var name in tabs) {
    		var tabContent = tabs[name];
    		result.appendChild(tabContent);
    	}
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
            console.log(callback);
            callback();
        }
    }

    function Sidebar(args) {
        var that = this,
            holder = args.holder,
            side = args.side || 'right',
            onToggleInit = args.onToggle || undefined,
            tabNames = args.tabs;

        var toggleCallbacks = [];
        if(typeof onToggleInit !== undefined) {
            toggleCallbacks.push(onToggleInit);
        }
        var tabs = generateTabs(tabNames);

        var element = renderContainer(this, side);

        var content = render(tabs, this);
        element.appendChild(content);
        this.element = element;

        this.toggle = function() {
            if(element.style.width === '0px') {
                element.style.width = '';
                content.style.display = '';
            }
            else {
                element.style.width = 0;
                content.style.display = 'none';
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
            }
        });

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