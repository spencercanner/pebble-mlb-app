var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');
var Light = require('ui/light');

var menu = new UI.Menu();
var gameDetails = new UI.Card();
gameDetails.title("");
gameDetails.body("");
gameDetails.style("small");
var gameOfInterest = "";
var gameInfo = [];
var lastTimecode=0;
var oldLastTimecode=0;
var items = [];
var inMenu = 1;

menu.show();
getData(buildGamesList);
var interval = setInterval(function () {
	getData(buildGamesList);
}, 30000);


menu.on('select', function(e) {
	inMenu = 2;
	lastTimecode = 0;
	oldLastTimecode=0;
	gameDetails.title("");
	gameDetails.body("");
	var selectedTitle = e.item.title;
	if (selectedTitle == "No current games"){
		return;
	} 
	var selectedSubtitle = e.item.subtitle;
	for (var id in gameInfo){
		if (gameInfo[id][0].menutitle == selectedTitle && gameInfo[id][0].menusubtitle == selectedSubtitle)
			gameOfInterest = id;
	}
	gameDetails.show();
	clearInterval(interval);
	getData(buildGamesList);
	interval = setInterval(function () {
		getData(buildGamesList);
	}, 30000);
});



gameDetails.on('click', 'back', function (){
	gameDetails.hide();
	gameDetails.title("");
	gameDetails.body("");
	gameOfInterest = "";
	oldLastTimecode = 0;
	lastTimecode = 0;
	inMenu = 1;
	menu.items(0, items);
	clearInterval(interval);
	getData(buildGamesList);
	menu.show();
	interval = setInterval(function () {
		getData(buildGamesList);
	}, 30000);
});

gameDetails.on('click', 'select', function() {
	clearInterval(interval);
	getData(buildGamesList);
	interval = setInterval(function () {
		getData(buildGamesList);
	}, 30000);
});
gameDetails.on('accelTap', function(){
  clearInterval(interval);
	getData(buildGamesList);
	interval = setInterval(function () {
		getData(buildGamesList);
	}, 30000);
});
menu.on('accelTap', function(){
	clearInterval(interval);
	getData(buildGamesList);
	interval = setInterval(function () {
		getData(buildGamesList);
	}, 30000);
});

function getData (callback) {
		var URL = "http://gd2.mlb.com/components/game/mlb/notifications.json";
		ajax({url: URL, type: 'json', async: true, cache: false}, function(data) {
			callback(data);
		});
}

function buildGamesList(data){
	var info = data.data;
	var alerts = info.alerts;
	var lastpbp = alerts.last_pbp;
	var pbp = lastpbp.pbp;
	gameInfo = [];
	items = [];
	if (lastpbp === "" && alerts.game === undefined){
		items.push({title: "No current games"});
	}
	else {
		var games = alerts.game;
		var item;
		var title;
		if (!Array.isArray(pbp)){
			var temppbp = pbp;
			pbp = [];
			pbp.push(temppbp);
		}
		if (!Array.isArray(games)){
			var tempGames = games;
			games = [];
			games.push(tempGames);
		}
		for (var i = 0; i < pbp.length; i++){
			item = pbp[i];
			title = item.away_name_abbrev + " " + item.runs_away +  ", " + item.home_name_abbrev + " " + item.runs_home;
			if (gameInfo.indexOf(item.id) == -1 && (item.timecode.split("_")[1] > lastTimecode || item.text == gameDetails.body())){
				gameInfo.push(item.id);
				gameInfo[item.id] = [];
				items.push({title: title, subtitle: "In Progress"});
				var top;
				if (item.top_inning == "Y")
					top = "Top of the ";
				else
					top = "Bottom of the ";
				var inning;
				switch (item.inning){
					case("1"):
						inning = item.inning + "st";
						break;
					case("2"):
						inning = item.inning + "nd";
						break;
					case("3"):
						inning = item.inning + "rd";
						break;
					default:
						inning = item.inning + "th";
						break;
				}
				var outs;
				switch (item.outs){
					case("0"):
						outs = "No outs";
						break;
					case("1"):
						outs = item.outs + " out";
						break;
					default:
						outs = item.outs + " outs";
						break;
				}
				var runners;
				if (item.runners_on_base === ""){
					runners = "No runners on base";
				}
				else if(item.runners_on_base == "123"){
					runners = "Bases loaded";
				}
				else {
					runners = "Runners on ";
					for (var j = 0; j < item.runners_on_base.length; j++){
						if (j > 0)
							runners += " and ";
						switch(item.runners_on_base[j]){
							case("1"):
								runners += "1st";
								break;
							case("2"):
								runners += "2nd";
								break;
							case("3"):
								runners += "3rd";
								break;
							default:
								break;
						}				
					}
					if (runners.split(" ").length == 3)
						runners = runners.replace("Runners", "Runner");
				}
				gameInfo[item.id].push({title: title + "\n" + top + inning + ", " + outs + ", " + runners, 
																content: item.text, timecode: item.timecode, menutitle: title, menusubtitle: "In Progress"});
			}
			else if (gameInfo.indexOf(item.id) != -1 && lastTimecode === 0 && item.id == gameOfInterest){
				lastTimecode = item.timecode.split("_")[1];
			}
		}
		
		if (gameOfInterest !== "" && gameInfo.indexOf(gameOfInterest) == -1 && gameDetails.body() !== "" && 
				gameDetails.title() !== "" && lastTimecode > 0){
			gameInfo.push(gameOfInterest);
			gameInfo[gameOfInterest] = [];
			var splitTitle = gameDetails.title().split(" ");
			var createdTitle = splitTitle[0] + " " + splitTitle[1] + " " + splitTitle[2] + " " + splitTitle[3];
			gameInfo[gameOfInterest].push({title: gameDetails.title(), content: gameDetails.body(), 
																		 timecode: "000_" + lastTimecode, menutitle: createdTitle, menusubtitle: "In Progress"});
		}
		for (i = 0; i < games.length; i++){
			item = games[i].alert;
			if (Array.isArray(item))
				item = item[0];
			if ((gameInfo.indexOf(games[i].game_id) == -1)|| 
							(gameInfo.indexOf(games[i].game_id) != -1 && 
							 (item.timecode.split("_")[1] >= gameInfo[games[i].game_id][0].timecode.split("_")[1] ||
						item.timecode.split("_")[1] == oldLastTimecode) && 
						 (item.category == "end_of_half_inning"|| item.category == "game_over" || item.category == "final" || 
							item.category == "delayed")) || (item.category == "game_over" || item.category == "final")){
				var subtitle;
				if (item.category == "pregame"){
					title = item.brief_text.substring(19, 30).trim();						
					title = title[title.length - 1] == "a" ? title.substring(0, title.length-2) : title;
					title = title[title.length - 1] == "t" ? title.substring(0, title.length-3) : title;
					title = title.replace(" at ", ", ");
					subtitle = "Warmup";
				}
				else if (item.category == "warmup"){
					title = item.brief_text.substring(19, 30).trim();
					title = title[title.length - 1] == "a" ? title.substring(0, title.length-2) : title;
					title = title[title.length - 1] == "t" ? title.substring(0, title.length-3) : title;
					title = title.replace(" at ", ", ");
					subtitle = "Warmup";
				}
				else if (item.category == "end_of_half_inning"){
					title = item.brief_text.split(" - ")[1];
					subtitle = "In Progress";
				}
				else if (item.category == "game_over"){
					title = item.brief_text.substring(19, item.brief_text.length).trim();
					subtitle = "Final";
				}
				else if (item.category == "final"){
					title = item.brief_text.substring(15, item.brief_text.length).trim();
					subtitle = "Final";
				}
				else if (item.category == "delayed") {
					//home_run, delayed, pitcher_change, run scoring
					title = item.brief_text.split(" - ")[1];
					subtitle = "Delayed";
				}
				else if (item.category == "delayed_start") {
					title = item.brief_text.substring(16, item.brief_text.length).trim().split(" at ");
					title = title[0] + ", " + title[1].substring(0, 3).trim();
					subtitle = "Delayed Start";
				}
				else {
					title = item.brief_text.split(" - ")[1];
					subtitle = "In Progress";
				}
				if(title.indexOf(",") > -1 && 
					 item.brief_text.substring(3,6).replace(":", "") != title.split(", ")[1].split(" ")[0]){
					var titleTeams = title.split(", ");
					var firstTeam = titleTeams[0];
					var secondTeam = titleTeams[1];
					title = secondTeam.split(" ")[0] + " " + secondTeam.split(" ")[1] + ", " + 
						firstTeam.split(" ")[0] + " " + firstTeam.split(" ")[1];
				}
				if (gameInfo.indexOf(games[i].game_id) == -1){
					gameInfo.push(games[i].game_id);
					items.push({title: title, subtitle: subtitle});
				}
				else {
					for (var k = 0; k < items.length; k++){
							if (items[k].title == title){
								items[k].subtitle = subtitle;
							}
					}
				}
				gameInfo[games[i].game_id] = [];
				gameInfo[games[i].game_id].push({title: title, content: item.text, timecode: item.timecode, 
																				 menutitle: title, menusubtitle: subtitle});
			}
		}
		items.sort(function(a, b) {
			if (a.subtitle < b.subtitle)  return 1;
			else if (a.subtitle > b.subtitle)  return -1;
			else {
				if (a.title < b.title)  return -1;
				else if (a.title > b.title)  return 1;
				return 0;
			}
		});
	}
	if (inMenu == 1){
		menu.items(0, items);
	}
	else if(inMenu == 2) {
		if (gameInfo.indexOf(gameOfInterest) != -1){
			if((gameDetails.title() != gameInfo[gameOfInterest][0].title || 
					gameDetails.body() != gameInfo[gameOfInterest][0].content) && 
				 ((gameInfo[gameOfInterest][0].timecode.split("_")[1] > lastTimecode) || 
					gameInfo[gameOfInterest][0].timecode.split("_")[1] == oldLastTimecode)){
				if (gameDetails.title() !== "" && gameDetails.body() !== ""){
						Vibe.vibrate('short');
						Light.trigger();
				}
				var temp = oldLastTimecode;
				oldLastTimecode = lastTimecode;
				if (gameInfo[gameOfInterest][0].timecode.split("_")[1] != temp) {
					lastTimecode = gameInfo[gameOfInterest][0].timecode.split("_")[1];
				}
				gameDetails.scrollable(false);
				gameDetails.title(gameInfo[gameOfInterest][0].title);
				gameDetails.body(gameInfo[gameOfInterest][0].content);
				gameDetails.scrollable(true);
			}
		}
	}
}


