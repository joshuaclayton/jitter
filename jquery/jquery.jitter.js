(function($) {
  $.timer = function (interval, callback) {
    var interval = interval || 100;
    if (!callback) { return false; }
    _timer = function (interval, callback) {
      this.stop = function () { clearInterval(self.id); };
      this.internalCallback = function () { callback(self); };
      this.reset = function (val) {
        if (self.id) { clearInterval(self.id); }
        var val = val || 100;
        this.id = setInterval(this.internalCallback, val);
      };
      this.interval = interval;
      this.id = setInterval(this.internalCallback, this.interval);
      var self = this;
      
      return self;
    };
    return _timer(interval, callback);
  };
})(jQuery);
(function($) {
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings);
    options.currentFeed = $.jitter.feeds[options.feed];
    
    try {
      if(options.currentFeed == $.jitter.feeds.search && !options.query) { throw($.jitter.errors.invalidSearchRequest); }
      if(options.currentFeed == $.jitter.feeds.groupTimeline && (!options.users.length || !options.users.groupName)) { throw($.jitter.errors.invalidGroupTimelineRequest); }
      if(options.currentFeed == $.jitter.feeds.userTimeline && !options.username) { throw($.jitter.errors.invalidUserTimelineRequest); }
    } catch(error) {
      alert("Error: " + error.name + "\nMessage: " + error.message);
    }
    
    // wrapper for all private instance variables
    var jitter = {};
    jitter.tweets = [];

    // public object
    var public = {};

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
      url += "?" + $.param(buildRequestParams());
      return url;
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

    var updateTweets = function() {
      $.ajax({
        type: "GET",
        url: buildURL(options.currentFeed),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }                                                 // set data to data from search results
          var originalSinceID = jitter.sinceID;                                                     // freeze sinceID to see if sinceID was set from a previous request
          var updatingExistingTweets = originalSinceID && jitter.sinceID;

          if(options.currentFeed.trackSince === true && data[0]) { jitter.sinceID = data[0].id; }   // set sinceID to the 'newest' tweet in the results
          if(options.onUpdate && typeof(options.onUpdate) == "function"){ options.onUpdate(data); } // trigger the onUpdate callback

          if(updatingExistingTweets) { data = data.reverse(); }                                     // reverse dataset for unshift

          $.each(data, function(index, item) {
            updatingExistingTweets ? jitter.tweets.unshift(item) : jitter.tweets.push(item);
          });
        }
      });
    };
    
    // point to internals
    public.tweets = function() { return jitter.tweets; };
    public.updateTweets = function() { updateTweets(); };
    
    // make feed info public
    public.feedClass = feedClass;
    public.feedTitle = feedTitle;
    
    // timer setup 
    jitter.timer = $.timer(1000 * options.refreshRate, function(t) {
      updateTweets();
    });

    public.stop = function() {
      jitter.timer.stop();
    };
    
    public.start = function() {
      jitter.timer.reset(options.refreshRate);
    }

    updateTweets();

    return public;
  };
})(jQuery);
(function($) {
  $.jitter.defaults = {
    refreshRate: 60,
    feed: "search",
    query: "jquery",
    onUpdate: function(tweets) { if(tweets[0]) { alert("Newest Tweet:\n" + tweets[0].text); } else { alert("No new tweets, sorry!"); } }
  };
})(jQuery);
(function($) {
  $.jitter.errors = {
    invalidSearchRequest: {
      name: "Invalid Search Request",
      message: "Your search jitter is lacking data; please verify that a query is supplied."
    },
    invalidGroupTimelineRequest: {
      name: "Invalid Group Timeline Request",
      message: "Your group timeline jitter is lacking data; please verify that at least one user is selected and a group name has been selected."
    },
    invalidUserTimelineRequest: {
      name: "Invalid User Timeline Request",
      message: "Your user timeline jitter is lacking data; please verify that a username has been assigned."
    }
  };
})(jQuery);
(function($) {
  $.jitter.feeds = {
    publicTimeline: {
      url: "http://twitter.com/statuses/public_timeline.json",
      name: "public",
      title: "Public Timeline"
    },
    friendsTimeline: {
      url: "http://{username}:{password}@twitter.com/statuses/friends_timeline.json",
      requiresUsername: true,
      requiresPassword: true,
      trackSince: true,
      name: "friends-{username}",
      title: "Friend Timeline for {username}"
    },
    groupTimeline: {
      url: "http://search.twitter.com/search.json",
      trackSince: true,
      filteredUsers: true,
      name: "search-users-{groupName}",
      title: "{groupName} Timeline"
    },
    userTimeline: {
      url: "http://twitter.com/statuses/user_timeline/{username}.json",
      requiresUsername: true,
      trackSince: true,
      name: "user-{username}",
      title: "Timeline for {username}"
    },
    directMessages: {
      url: "http://{username}:{password}@twitter.com/direct_messages.json",
      trackSince: true,
      requiresUsername: true,
      requiresPassword: true,
      name: "direct-message-{username}",
      title: "Direct Messages for {username}"
    },
    rateLimitStatus: {
      url: "http://twitter.com/account/rate_limit_status.json"
    },
    search: {
      url: "http://search.twitter.com/search.json",
      performSearch: true,
      trackSince: true,
      name: "search-{query}",
      title: "Search Results for '{query}'"
    }
  };
})(jQuery);
