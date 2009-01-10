String.prototype.cssClassify = function(sep) {
  sep = sep || "-";
  var result = this;
  return result.replace(/[^\x00-\x7F]+/, '')
    .replace(/[^\w\-_\+]+/g, sep)
    .replace(new RegExp(sep + "+"), sep)
    .replace(new RegExp("^" + sep + "|" + sep + "$"), '')
    .toLowerCase();
};

(function($) {
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings);
    options.currentFeed = $.jitter.feeds[options.feed];
    var updateTweets = function() {};
    
    // wrapper for all private instance variables
    var jitter = {tweets: []};

    // public object
    var self = {};

    // private methods
    var buildRequestParams = function() {
      var requestParams = {};
      if(jitter.sinceID) { requestParams.since_id = jitter.sinceID; }
      if(options.currentFeed.performSearch && options.query) { requestParams.q = options.query; }
      if(options.currentFeed.filteredUsers && options.users.length) { requestParams.q = $.map(options.users, function(item) { return "from:" + item; }).join(" OR "); }
      return requestParams;
    };

    var buildURL = function(feedItem, urlOptions) {
      urlOptions = urlOptions || {};
      var url = urlOptions.url || feedItem.url;
      if(feedItem.requiresUsername) { url = url.replace(/\{username\}/, urlOptions.username || options.username); }
      if(feedItem.requiresPassword) { url = url.replace(/\{password\}/, urlOptions.password || options.password); }

      var queryString = $.param(buildRequestParams());
      if(queryString.length) { url += "?" + queryString; }
      
      return url;
    };
    
    var calculateRefreshRate = function() {
      return 1000 * options.refreshRate;
    };
    
    var handleError = function(error) {
      if(options.onError && typeof(options.onError) == "function") {
        options.onError(error);
      }
    };
    
    var setupTimer = function() {
      if(!jitter.timer) {
        jitter.timer = $.timer(calculateRefreshRate(), function(t) {
          updateTweets();
        });

        self.stop = function() {
          jitter.timer.stop();
        };

        self.start = function() {
          jitter.timer.reset(calculateRefreshRate());
        };
      }
    };
    
    // public instance methods
    var feedClass = function() {
      var feedClassName = options.currentFeed.name;
      if(options.currentFeed.requiresUsername)  { feedClassName = feedClassName.replace(/\{username\}/, options.username); }
      if(options.currentFeed.performSearch)     { feedClassName = feedClassName.replace(/\{query\}/, options.query.cssClassify()); }
      if(options.currentFeed.filteredUsers)     { feedClassName = feedClassName.replace(/\{groupName\}/, options.groupName.cssClassify()); }
      return feedClassName;
    };

    var feedTitle = function() {
      var feedTitleName = options.currentFeed.title;
      if(options.currentFeed.requiresUsername)  { feedTitleName = feedTitleName.replace(/\{username\}/, options.username); }
      if(options.currentFeed.performSearch)     { feedTitleName = feedTitleName.replace(/\{query\}/, options.query); }
      if(options.currentFeed.filteredUsers)     { feedTitleName = feedTitleName.replace(/\{groupName\}/, options.groupName); }
      return feedTitleName;
    };

    updateTweets = function() {
      $.ajax({
        type: "GET",
        url: buildURL(options.currentFeed),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }                                                 // set data to data from search results
          var originalSinceID = jitter.sinceID,                                                     // freeze sinceID to see if sinceID was set from a previous request
              updatingExistingTweets = !!jitter.sinceID;

          if(options.currentFeed.trackSince == true && data[0]) { jitter.sinceID = data[0].id; }    // set sinceID to the 'newest' tweet in the results
          if(options.onUpdate && typeof(options.onUpdate) == "function"){ options.onUpdate(data); } // trigger the onUpdate callback

          if(updatingExistingTweets) { data = data.reverse(); }                                     // reverse dataset for unshift

          $.each(data, function(index, item) {
            var modify = updatingExistingTweets ? jitter.tweets.unshift(item) : jitter.tweets.push(item);
          });
        }
      });
    };
    
    // point to internals
    self.tweets = function() { return jitter.tweets; };
    self.updateTweets = function() { updateTweets(); };
    self.options = function() { return options; };
    
    // make feed info public
    self.feedClass = feedClass;
    self.feedTitle = feedTitle;
    
    try {
      if(options.currentFeed == $.jitter.feeds.search && !options.query) { throw($.jitter.errors.invalidSearchRequest); }
      if(options.currentFeed == $.jitter.feeds.groupTimeline && (!options.users || (options.users && !options.users.length) || !options.groupName)) { throw($.jitter.errors.invalidGroupTimelineRequest); }
      if(options.currentFeed == $.jitter.feeds.userTimeline && !options.username) { throw($.jitter.errors.invalidUserTimelineRequest); }
    } catch(error) {
      handleError(error);
      return;
    }
    
    setupTimer();
    
    updateTweets();

    return self;
  };
})(jQuery);