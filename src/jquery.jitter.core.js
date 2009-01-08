(function($) {
  $.jitter = function(settings) {
    var options = $.extend({}, settings, $.jitter.defaults);
    options.currentFeed = $.jitter.feeds[options.feed];
    
    // wrapper for all private instance variables
    var jitter = {};
    
    // public object
    var public = {};

    // private methods
    var buildData = function() {
      var data = {};
      if(jitter.sinceID)              { data.since_id = jitter.sinceID; }
      if(options.currentFeed.performSearch && options.query) { data.q = options.query; }
      if(options.currentFeed.filteredUsers && options.users.length) { data.q = $.map(options.users, function(item) { return "from:" + item; }).join(" OR "); }
      return data;
    };

    var buildURL = function(feedItem, urlOptions) {
      urlOptions = urlOptions || {};
      var url = urlOptions.url || feedItem.url;
      if(feedItem.requiresUsername) { url = url.replace(/\{username\}/, urlOptions.username || options.username); }
      if(feedItem.requiresPassword) { url = url.replace(/\{password\}/, urlOptions.password || options.password); }
      url += "?" + $.param(buildData());
      return url;
    };

    // public instance methods
    public.tweets = function() { return jitter.tweets; };

    public.feedClass = function() {
      var feedClass = options.currentFeed.name;
      if(options.currentFeed.requiresUsername)  { feedClass = feedClass.replace(/\{username\}/, options.username); }
      if(options.currentFeed.performSearch)     { feedClass = feedClass.replace(/\{query\}/, options.query.cssClassify()); }
      if(options.currentFeed.filteredUsers)     { feedClass = feedClass.replace(/\{groupName\}/, options.groupName.cssClassify()); }
      return feedClass;
    };

    public.feedTitle = function() {
      var feedTitle = options.currentFeed.title;

      if(options.currentFeed.requiresUsername)  { feedTitle = feedTitle.replace(/\{username\}/, options.username); }
      if(options.currentFeed.performSearch)     { feedTitle = feedTitle.replace(/\{query\}/, options.query); }
      if(options.currentFeed.filteredUsers)     { feedTitle = feedTitle.replace(/\{groupName\}/, options.groupName); }
      return feedTitle;
    };

    var updateTweets = function() {
      $.ajax({
        type: "GET",
        url: buildURL(options.currentFeed),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }                           // set data to data from search results
          var originalSinceID = jitter.sinceID;                                      // freeze sinceID to see if sinceID was set from a previous request
          var updatingExistingTweets = originalSinceID && jitter.sinceID;

          if(options.currentFeed.trackSince === true && data[0]) { jitter.sinceID = data[0].id; }   // set sinceID to the 'newest' tweet in the results
          if(options.onUpdate && typeof(options.onUpdate) == "function"){ options.onUpdate(data); }  // trigger the onUpdate callback

          if(updatingExistingTweets) { data = data.reverse(); }               // reverse dataset for unshift

          $.each(data, function(index, item) {
            updatingExistingTweets ? jitter.tweets.unshift(item) : jitter.tweets.push(item);
          });
        }
      });
    };

    public.updateTweets = function() { updateTweets(); };

    // timer setup 
    jitter.timer = $.timer(1000 * refreshRate /* {refreshRate} seconds (defaults to 60s) */, function(t) {
      updateTweets();
    });

    public.stop = function() {
      jitter.timer.stop();
    };

    public.updateTweets();

    return public;
  }
})(jQuery);