var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');

var refreshBoolean = false;
var menu = new UI.Menu();
var gameDetails = new UI.Card();
var interval;
var teamOfInterest;

var main = new UI.Card({
  title: 'MLB Live',
  body: "Press any button to view today's games",
  titleColor: 'indigo', // Named colors
  bodyColor: '#9a0036' // Hex colors
});

main.show();

main.on('click', function() {
	console.log('click');
	showGames();
});

gameDetails.on('click', 'back', function (){
	gameDetails.hide();
	gameDetails.title("");
	gameDetails.body("");
	clearInterval(interval);
	refreshBoolean = false;
	showGames();
});

var showGames = function(){
	console.log('function');
	var URL = "http://gd2.mlb.com/components/game/mlb/notifications.json";
	ajax(
  {
    url: URL,
    type: 'json'
  },
  function(data) {
		var info = data.data;
		var alerts = info.alerts;
		var lastpbp = alerts.last_pbp;
		var pbp = lastpbp.pbp;
		var games = alerts.game;
		var items = [];
		var homeTeams = [];
		var item;
		var title;
		for (var i = 0; i < pbp.length; i++){
			item = pbp[i];
			title = item.away_name_abbrev + "(" + item.runs_away +  ") at " + item.home_name_abbrev + "(" + item.runs_home + ")";
			if (homeTeams.indexOf(item.home_name_abbrev) == -1){
				homeTeams.push(item.home_name_abbrev);
				homeTeams[item.home_name_abbrev] = [];
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
					case("1"):
						outs = item.outs + " out";
						break;
					default:
						outs = item.outs + " outs";
				}
				var runners;
					switch (item.runners_on_base){
						case(""):
							runners = "No runners on base";
							break;
						case("1"):
							runners = "1 runner on base";
							break;
						default:
							runners = item.runners_on_base + " runners on base";
							break;
					}
				homeTeams[item.home_name_abbrev].push({title: title.replace(" at ", "-") + "\n" + top + inning + ", " + outs + ", " + runners, content: item.text});
			}
		}
		for (i = 0; i < games.length; i++){
			item = games[i].alert;
			title = item.brief_text.substring(20, 30).trim();
			
			if (homeTeams.indexOf(title.substring(7,10).trim()) == -1){
				homeTeams.push(title.substring(7,10).trim());
				homeTeams[title.substring(7,10).trim()] = [];
				var subtitle;
				if (item.category == "pregame"){
					subtitle = "Pregame";
				}
				else if (item.category == "warmup"){
					subtitle = "Warmup";
				}
				else if (item.category == "in_progress"){
					subtitle = "In Progress";
				}
				else if (item.category == "final"){
					subtitle = "Final";
				}
				else {
					continue;
				}
				items.push({title: title, subtitle: subtitle});
				homeTeams[title.substring(7,10).trim()].push({title: title.replace(" at ", "-"), content: item.text});
			}
		}
		items.sort(
		 function(a,b){
				if (a.subtitle!=b.subtitle){
					 return (b.subtitle-a.subtitle);
				} else {
					 return (a.title-b.title);
				}
		 });
		menu.sections([{items: items}]);
		menu.show();
		menu.on('select', function(e) {
			teamOfInterest =e.item.title.split(" at ")[1].substring(0,3);
			showGameDetails(e.item.title.split(" at ")[1].substring(0,3), homeTeams);
		});
	});
};

var showGameDetails = function (text, homeTeams){
	console.log(homeTeams, text);
	gameDetails.title(homeTeams[text][0].title);
	gameDetails.body(homeTeams[text][0].content);
	gameDetails.scrollable(true);
	gameDetails.style("small");
	gameDetails.show();
	refreshBoolean = true;
	
	clearInterval(interval);
	interval = setInterval(function() {
		console.log("here");
		var URL = "http://gd2.mlb.com/components/game/mlb/notifications.json";
		ajax(
		{
			url: URL,
			type: 'json'
		},
		function(data) {
			var info = data.data;
			var alerts = info.alerts;
			var lastpbp = alerts.last_pbp;
			var pbp = lastpbp.pbp;
			var homeTeams = [];
			var item;
			var title;
			for (var i = 0; i < pbp.length; i++){
				item = pbp[i];
				title = item.away_name_abbrev + "(" + item.runs_away +  ")-" + item.home_name_abbrev + "(" + item.runs_home + ")";
				if (item.home_name_abbrev == teamOfInterest && homeTeams.indexOf(item.home_name_abbrev) == -1){
					homeTeams.push(item.home_name_abbrev);
					homeTeams[item.home_name_abbrev] = [];
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
						case("1"):
							outs = item.outs + " out";
							break;
						default:
							outs = item.outs + " outs";
					}
					var runners;
					switch (item.runners_on_base){
						case(""):
							runners = "No runners on base";
							break;
						case("1"):
							runners = "1 runner on base";
							break;
						default:
							runners = item.runners_on_base + " runners on base";
							break;
					}
					gameDetails.title(title + "\n" + top + inning + ", " + outs + ", " + runners);
					gameDetails.body(item.text);
				}
			}
	});
	}, 10000);
};



