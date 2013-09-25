(function bpExt($){
	$(function(){
		var lastDoc = null;
		
		$('.board-header-btns.right').prepend(
			'<a href="#" class="board-header-btn td-open-burndown"><span class="text">Burndown</span></a>'
		);
		$('.td-open-burndown').on('click', function(){
			$.modal('<div id="basic-modal-content" style="background: white; padding: 20px"><h2>Trello Burndown</h2><p style="width: 800px"></p><div id="td-burndown-chart"></div></div>');

			$.getJSON('http://127.0.0.1:5984/trello_test/aa8285e448290a4a84995258e402fcbe', function(data){
				lastDoc = data;
				updateDb();

				var days = lastDoc.dates.map(function(e) {var dd = new Date(e); return dd.getDate() + '-' + (dd.getMonth() + 1) + '-' + dd.getFullYear();});
				var hours = lastDoc.hours_left;

				$('#td-burndown-chart').highcharts({
		            title: {
		                text: 'CPH Team, Hay'
		            },
		            xAxis: {
		                categories: days
		            },
		            yAxis: {
		                title: {
		                    text: 'Hours left'
		                },
		                plotLines: [{
		                    value: 0,
		                    width: 1,
		                    color: '#808080'
		                }]
		            },
		            tooltip: {
		                valueSuffix: 'h'
		            },
		            legend: {
		                layout: 'vertical',
		                align: 'right',
		                verticalAlign: 'middle',
		                borderWidth: 0
		            },
		            series: [{
		                name: 'CPH',
		                data: hours
		            }]
		        });
			});
		});

		// update db from time to time
		function updateDb(){
			var _lists = ModelCache._cache.List;
			var _cards = ModelCache._cache.Card;
			var totalLeft = 0;

			//for each list
			for(var listID in _lists){
				if(!_lists.hasOwnProperty(listID)){ continue; } //skip if not a list
				if(_lists[listID].attributes.closed){ continue; } //skip if the list is closed
				if (_lists[listID].attributes.name != 'Todo' && _lists[listID].attributes.name != 'To Do') { continue;} // We need only 'Todo' list

				//loop through each card
				for(var cardID in _cards){
					if(!_cards.hasOwnProperty(cardID)){ continue; } //skip if not a card
					if(_cards[cardID].attributes.closed){ continue; } //skip if the card is closed
					if(_cards[cardID].attributes.idList != listID){ continue; } //skip if the card doesn't belong to this list
					if(_cards[cardID].view.el.className.indexOf('hide') >= 0){ continue; } //skip if hidden

					//determine the number of points on the card
					var cardPoints = Number((_cards[cardID].attributes.name.match(/\([0-9.]+(?=\))/gi) || ['(0'])[0].split('(')[1]);

					if(cardPoints){
						totalLeft += cardPoints;
					}
				}
			}

			var today = new Date().toDateString();
			var todaysInDoc = lastDoc.dates.filter(function(e){return new Date(e).toDateString() == today});
			var lastHours = lastDoc.hours_left[lastDoc.hours_left.length - 1];

			if (lastHours != totalLeft || todaysInDoc.length == 0) {
				// if nothing were tracked today - add new record
				if (todaysInDoc.length == 0) {
					lastDoc.dates.push(new Date().getTime());
					lastDoc.hours_left.push(totalLeft);
				} else { // else update the last record
					lastDoc.dates[lastDoc.dates.length - 1] = new Date().getTime();
					lastDoc.hours_left[lastDoc.hours_left.length - 1] = totalLeft;
				}

				$.ajax({
					url: 'http://127.0.0.1:5984/trello_test/aa8285e448290a4a84995258e402fcbe',
					type: 'PUT',
					data: JSON.stringify(lastDoc),
					success: function(){
						console.log("db updated!");
					}
				});
			}
			
			//setTimeout(updateDb, 100);
		};
	});
})(jQuery);