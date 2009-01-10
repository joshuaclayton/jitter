(function($) {
  $.jitter.defaults = {
    refreshRate: 60,
    feed: "search",
    query: "jquery",
    onUpdate: function(tweets) { if(tweets[0]) { alert("Newest Tweet:\n" + tweets[0].text); } else { alert("No new tweets, sorry!"); } },
    onError: function(error) { alert("Error: " + error.name + "\nMessage: " + error.message); }
  };
})(jQuery);
