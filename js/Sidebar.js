(function(Ayamel) {
	"use strict";

	function Sidebar(args) {
		var that = this,
            holder = args.holder,
            player = args.player,
			tabNames = args.tabs;

        this.player = player;

        this.holder = holder;

		var tabs = generateTabs(tabNames);
		this.tabs = tabs;

		var element = render(tabs, player, this);
        this.element = element;

        holder.appendChild(element);

        defineProperties(this);
	}

    function toggle(sidebar) {
        if(sidebar.width === '0px') {
            sidebar.width = '';
        }
        else {
            sidebar.width = 0;
        }
        sidebar.player.resetSize();
    }

	function generateTabs(tabNames) {
	    var result = {};
	    for(var i = 0; i < tabNames.length; i++) {
	    	var tabName = tabNames[i];
	    	var tabContentStr = '<div class="tab-pane" id="' + name + '"></div>';
	    	result[tabName] = Ayamel.utils.parseHTML(tabContentStr);
	    }
	    return result;
    }

    function render(tabs, player, sidebar) {
        var sidebarStr = '<div class="sidebar"></div>';
        var result = Ayamel.utils.parseHTML(sidebarStr);
    	var tabHeads = renderTabHeads(tabs);
        result.appendChild(tabHeads);
        var tabContents = renderTabContents(tabs);
        result.appendChild(tabContents);
        var toggleTab = renderToggleTab(player, sidebar);
        result.appendChild(toggleTab);
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

    function renderToggleTab(player, sidebar) {
        var result = document.createElement('div');
        result.className = 'toggle-tab';
        result.addEventListener('click', function(e) {
            toggle(sidebar);
        });
        /*
        result.addEventListener('mouseover', function(e) {
            result.style.visibility = 'visible';
        });
        result.addEventListener('mouseout', function(e) {
            result.style.visibility = 'hidden';
        });
*/
        return result;
    }

    function defineProperties(sidebar) {
        Object.defineProperties(sidebar, {
            width: {
                get: function() {
                    return sidebar.element.style.width;
                },
                set: function(newWidth) {
                    sidebar.element.style.width = newWidth;
                }
            },
            height: {
                get: function() {
                    return sidebar.element.style.height;
                },
                set: function(newHeight) {
                    sidebar.element.style.height = newHeight;
                }
            }
        });
    }

    Ayamel.classes.Sidebar = Sidebar;

}(Ayamel));