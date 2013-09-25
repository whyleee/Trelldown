//initializes the script when the page is ready
var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		injectScript("trelldown.js");
		injectScript("simplemodal.js");
		injectScript("highcharts.js");

		function injectScript(s) {
			//add the script to the page
			var scr = document.createElement("script");
			scr.type = "text/javascript";
			//doesn't need cached because its loaded locally
			scr.src = chrome.extension.getURL(s)+'?v='+(new Date().getTime());
			(document.head || document.body || document.documentElement).appendChild(scr);
		}
	}
}, 10);