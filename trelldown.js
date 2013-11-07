(function bpExt($){
	$(function(){

		// list card links export
		$('.js-open-list-menu').on('click', function(){
			$link = $(this);
			function addExportButton() {
				$cardActions = $('.pop-over .content .pop-over-list:eq(1)');
				if (!$cardActions.find('.js-export-card-links').length){
					$cardActions.append('<li><a href="#" class="js-export-card-links">Export All Card Links in This List</a></li>');

					$('.js-export-card-links').on('click', function(){
						var links = [];
						var $list = $link.closest('.list');
						$list.find('.list-card').each(function(){
							var $card = $(this);
							var $cardTitle = $card.find('.list-card-title');
							var text = '';
							if ($card.find('.card-label.red-label').length){
								text += '[Bug]';
							}
							if ($card.find('.card-label.purple-label').length){
								text += '[CR]';
							}
							text += ' ' + $cardTitle.text().substring($cardTitle.text().indexOf(' '));
							links.push('<li><a href="{url}" style="color: rgb(17, 85, 204)">{text}</a></li>'.replace('{url}', $cardTitle.attr('href')).replace('{text}', text));
						});
						$.modal(
							('<div id="basic-modal-content" style="background: #e3e3e3; color: rgb(94, 94, 94); padding: 5px">' +
								'<a class="simplemodal-close" title="Close" style="position: absolute; top: 5px; right: 8px; color: black">x</a>' +
								'<h1>{title}</h1><hr/>' +
								'<p style="width: 800px">{content}</p>' +
								'<p style="margin-top: 30px">Copy-paste the list to export the data</p>' +
							'</div>')
							.replace('{title}', $list.find('.list-title h2').text() + ' cards')
							.replace('{content}', '<ul style="list-style: disc; padding-left: 17px">' + links.join('') + '</ul>'), {
								containerCss: {
									background: '#e3e3e3',
									paddingRight: '26px',
									paddingTop: '20px'
								}
							}
						);
					});
				} else {
					setTimeout(addExportButton, 0);
				}
			}
			setTimeout(addExportButton, 0);
		});

		// burndown
		var lastDoc = null;
		
		// now works only with 'NBT' board (hardcoded)
		var boardName = $('.board-name').text().trim();
		if (boardName != 'NBT') {
			return;
		}
		
		$('.board-header-btns.right').prepend(
			'<a href="#" class="board-header-btn td-open-burndown"><span class="text">Burndown</span></a>'
		);
		$('.td-open-burndown').on('click', function(){
			$.modal(
				('<div id="basic-modal-content" style="background: white; padding: 20px">' +
					'<a class="simplemodal-close" title="Close" style="position: absolute; top: 5px; right: 8px; color: black">x</a>' +
					'<h1>{title}</h1><hr/>' +
					'<div id="td-burndown-chart" style="width: 100%; height: 500px"></div>' +
				'</div>')
				.replace('{title}', 'Trello Burndown'), {
					containerCss: {
						background: '#e3e3e3',
						paddingRight: '26px',
						paddingTop: '20px',
						width: '1000px',
						height: '620px'
					}
				}
			);

			$.getJSON('http://couch.lab409.com:5984/trelldown/9a20e8758fac4cd6e5e7a6acff030435', function(data){
				lastDoc = data;
				updateDb();

				var hours = lastDoc.hours_left;
				//var days = lastDoc.dates.map(function(e) {var dd = new Date(e); return dd.getDate() + '-' + (dd.getMonth() + 1) + '-' + dd.getFullYear();});
				var days = lastDoc.dates.map(function(e) {return new Date(e);});
				var sprintLength = 10; // days
				var daysLeftCount = sprintLength - lastDoc.dates.length + 1;
				
				if (daysLeftCount > 0){
					var lastDay = new Date(lastDoc.dates[lastDoc.dates.length - 1]);
					for (var i = 1; i <= daysLeftCount; ++i){
						var nextDay = new Date();
						nextDay.setDate(lastDay.getDate() + i);

						if (nextDay.getDay() < 2){ // Sundary or Monday
							++daysLeftCount;
							continue;
						}

						var nextDayText = nextDay.getDate() + '-' + (nextDay.getMonth() + 1) + '-' + nextDay.getFullYear();
						//days.push(nextDayText);
						days.push(nextDay);
						hours.push(null);
					}
				}

				$('#td-burndown-chart').highcharts({
		            title: {
		                text: 'CPH Team, NBT'
		            },
		            credits: {
		                enabled: false
		            },
		            legend: {
		                enabled: false
		            },
		            xAxis: {
		                categories: days,
		                gridLineWidth: 1,
		                type: 'datetime',
                        tickmarkPlacement: 'on',
                        labels: {
            	            formatter: function() {
				                return Highcharts.dateFormat('%a, %b %d', this.value);
				            }
                        }
		            },
		            yAxis: {
		                title: {
		                    text: 'Hours left'
		                },
		                max: hours.length > 0 ? hours[0] + 5 : null,
		                min: 0,
		                plotLines: [{
		                    value: 0,
		                    width: 1,
		                    color: '#808080'
		                }]
		            },
		            tooltip: {
		                valueSuffix: 'h'
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
			var totalPoints = getSumPoints($('#board-header .list-total'));
			var donePoints = getSumPoints($('.list-title:contains("Done") .list-total'));
			var totalLeft = totalPoints - donePoints;
			// var totalLeftText = $('.list-title:contains("Todo"), .list-title:contains("To Do")').find('.list-total .points').text();
			// var totalLeft = totalLeftText ? parseInt(totalLeftText) : 0;

			var sprintOnly = true;
			if (sprintOnly) {
				var backlogPoints = getSumPoints($('.list-title:contains("Backlog") .list-total'));
				var sprintPoints = totalPoints - backlogPoints;
				totalLeft = sprintPoints - donePoints;
			}

			function getSumPoints($totals){
				var sumPoints = 0;
				$totals.find('span[class^="points-"],span[class*=" points-"]').each(function(){
					var pointsText = $(this).text();
					sumPoints += pointsText ? parseInt(pointsText) : 0;
				});
				return sumPoints;
			}
			// //for each list
			// for(var listID in _lists){
			// 	if(!_lists.hasOwnProperty(listID)){ continue; } //skip if not a list
			// 	if(_lists[listID].attributes.closed){ continue; } //skip if the list is closed
			// 	if (_lists[listID].attributes.name != 'Todo' && _lists[listID].attributes.name != 'To Do') { continue;} // We need only 'Todo' list

			// 	//loop through each card
			// 	for(var cardID in _cards){
			// 		if(!_cards.hasOwnProperty(cardID)){ continue; } //skip if not a card
			// 		if(_cards[cardID].attributes.closed){ continue; } //skip if the card is closed
			// 		if(_cards[cardID].attributes.idList != listID){ continue; } //skip if the card doesn't belong to this list
			// 		if(_cards[cardID].view.el.className.indexOf('hide') >= 0){ continue; } //skip if hidden

			// 		//determine the number of points on the card
			// 		var cardPoints = Number((_cards[cardID].attributes.name.match(/\([0-9.]+(?=\))/gi) || ['(0'])[0].split('(')[1]);

			// 		if(cardPoints){
			// 			totalLeft += cardPoints;
			// 		}
			// 	}
			// }

			var today = new Date();
			var tomorrow = new Date();
			tomorrow.setDate(today.getDate() + 1);

			var tomorrowString = tomorrow.toDateString();
			var tomorrowsInDoc = lastDoc.dates.filter(function(e){return new Date(e).toDateString() == tomorrowString});
			var lastHours = lastDoc.hours_left[lastDoc.hours_left.length - 1];

			if (lastHours != totalLeft || tomorrowsInDoc.length == 0) {
				var weekend = tomorrow.getDay() < 2;
				// if nothing were tracked today - add new record
				if (!weekend && tomorrowsInDoc.length == 0) {
					// if this is the first day - add yesterday also
					if (lastDoc.dates.length == 0) {
						lastDoc.dates.push(today.getTime());
						lastDoc.hours_left.push(totalLeft);
					}
					lastDoc.dates.push(tomorrow.getTime());
					lastDoc.hours_left.push(totalLeft);
				} else { // else update the last record
					if (lastDoc.dates.length == 0) { // it looks like today is weekend and no work done yet
						return;
					}
					lastDoc.dates[lastDoc.dates.length - 1] = tomorrow.getTime();
					lastDoc.hours_left[lastDoc.hours_left.length - 1] = totalLeft;
				}

				$.ajax({
					url: 'http://couch.lab409.com:5984/trelldown/9a20e8758fac4cd6e5e7a6acff030435',
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