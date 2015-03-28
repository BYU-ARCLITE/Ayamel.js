(function(Ayamel){
	"use strict";

	function SoundManager(main){
		var active = [],
			volume = isFinite(main.volume)?main.volume:1;
		this.main = main;
		this.players = [];
		this.active = active;

		Object.defineProperties(this,{
			volume: {
				get: function(){ return volume; },
				set: function(v){
					volume = +v||0;
					active.forEach(function(player){ player.volume = volume; });
				}
			}
		});

		//Enforce media synchronization
		main.addEventListener('timeupdate',function(){
			var ctime = main.currentTime;
			active.forEach(function(player){
				if(player === main){ return; }
				if(Math.abs(player.currentTime - ctime) < .05){ return; }
				player.currentTime = ctime;
			});
		},false);
		main.addEventListener('ratechange',function(){
			active.forEach(function(player){
				if(player === main){ return; }
				player.playbackRate = main.playbackRate;
			});
		},false)
	}
	
	SoundManager.prototype.addPlayer = function(player, active){
		if(this.players.indexOf(player) === -1){
			this.players.push(player);
		}
		if(active){ this.activate(player); }
	};

	SoundManager.prototype.activate = function(player){
		if(this.players.indexOf(player) === -1){ return; }
		if(this.active.indexOf(player) > -1){ return; }
		this.active.push(player);
		if(player !== this.main){
			player.currentTime = this.main.currentTime;
			player.playbackRate = this.main.playbackRate;
		}
		player.volume = this.volume;
		player.muted = false;
		if(player.paused){ player.play(); }
	};

	SoundManager.prototype.deactivate = function(player){
		var idx = this.active.indexOf(player);
		if(idx === -1){ return; }
		this.active.splice(idx,1);
		player.pause();
	};

	Ayamel.classes.SoundManager = SoundManager;
}(Ayamel));