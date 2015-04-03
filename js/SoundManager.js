(function(Ayamel){
	"use strict";

	function SoundManager(main){
		var active = [],
			muted = !!main.muted,
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
					return volume;
				}
			},
			muted: {
				get: function(){ return muted; },
				set: function(m){
					muted = !!m;
					active.forEach(function(player){ player.muted = muted; });
					return muted;
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
		},false);
		main.addEventListener('volumechange',function(){
			volume = main.volume;
			muted = main.muted;
			active.forEach(function(player){
				if(player === main){ return; }
				player.volume = volume;
				player.muted = muted;
			});
		},false);

		function play(){
			active.forEach(function(player){
				if(player !== main){ player.play(); }
			});
		}
		main.addEventListener('play',play,false);
		main.addEventListener('playing',play,false);

		function pause(){
			active.forEach(function(player){
				if(player !== main){ player.pause(); }
			});
		}
		main.addEventListener('pause',pause,false);
		main.addEventListener('ended',pause,false);
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

		player.volume = this.volume;
		player.muted = this.muted;
		if(player !== this.main){
			player.currentTime = this.main.currentTime;
			player.playbackRate = this.main.playbackRate;
			if(!main.paused){ player.play(); }
		}
	};

	SoundManager.prototype.deactivate = function(player){
		var idx = this.active.indexOf(player);
		if(idx === -1){ return; }
		this.active.splice(idx,1);
		player.muted = true;
		if(player !== this.main){ player.pause(); }
	};

	Ayamel.classes.SoundManager = SoundManager;
}(Ayamel));