(function($) {
  $.jitter.feeds = {
    publicTimeline: {
      url: "http://twitter.com/statuses/public_timeline.{format}",
      name: "public",
      simpleTitle: "Public Timeline",
      title: "Public Timeline"
    },
    friendsTimeline: {
      url: "http://{username}:{password}@twitter.com/statuses/friends_timeline.{format}",
      requiresUsername: true,
      requiresPassword: true,
      trackSince: true,
      name: "friends-{username}",
      simpleTitle: "Friend Timeline",
      title: "Friend Timeline for {username}"
    },
    groupTimeline: {
      url: "http://search.twitter.com/search.{format}",
      trackSince: true,
      filteredUsers: true,
      name: "group-{groupName}",
      simpleTitle: "Group Timeline",
      title: "{groupName} Timeline"
    },
    userTimeline: {
      url: "http://twitter.com/statuses/user_timeline/{username}.{format}",
      requiresUsername: true,
      trackSince: true,
      name: "user-{username}",
      simpleTitle: "User Timeline",
      title: "Timeline for {username}"
    },
    directMessages: {
      url: "http://{username}:{password}@twitter.com/direct_messages.{format}",
      trackSince: true,
      requiresUsername: true,
      requiresPassword: true,
      name: "direct-message-{username}",
      simpleTitle: "Direct Messages",
      title: "Direct Messages for {username}"
    },
    search: {
      url: "http://search.twitter.com/search.{format}",
      performSearch: true,
      trackSince: true,
      name: "search-{query}",
      simpleTitle: "Search Feed",
      title: "Search Results for '{query}'"
    }
  };
  
  $.jitter.feeds.process = function(options) {
    options.currentFeed = typeof(options.feed) === "string" ? $.jitter.feeds[options.feed] : options.feed;
    var self = {
      performSearch: options.currentFeed.performSearch,
      trackSince: options.currentFeed.trackSince,
      simpleTitle: options.currentFeed.simpleTitle
    };
    
    (function() {
      var feedClassName = options.currentFeed.name;
      if(options.currentFeed.requiresUsername)  { feedClassName = feedClassName.interpolate({username: options.username}); }
      if(options.currentFeed.performSearch)     { feedClassName = feedClassName.interpolate({query: options.query.cssClassify()}); }
      if(options.currentFeed.filteredUsers)     { feedClassName = feedClassName.interpolate({groupName: options.groupName.cssClassify()}); }
      self.className = feedClassName;
    })();

    (function() {
      var feedTitleName = options.currentFeed.title;
      if(options.currentFeed.requiresUsername)  { feedTitleName = feedTitleName.interpolate({username: options.username}); }
      if(options.currentFeed.performSearch)     { feedTitleName = feedTitleName.interpolate({query: options.query}); }
      if(options.currentFeed.filteredUsers)     { feedTitleName = feedTitleName.interpolate({groupName: options.groupName}); }
      self.title = feedTitleName;
    })();
    
    try {
      if(options.currentFeed == $.jitter.feeds.search && !options.query) { throw($.jitter.errors.invalidSearchRequest); }
      if(options.currentFeed == $.jitter.feeds.groupTimeline && (!options.users || (options.users && !options.users.length) || !options.groupName)) { throw($.jitter.errors.invalidGroupTimelineRequest); }
      if(options.currentFeed == $.jitter.feeds.userTimeline && !options.username) { throw($.jitter.errors.invalidUserTimelineRequest); }
    } catch(error) {
      $(document).trigger("jitter.feedError", error);
      return;
    }
    
    self.url = function() {
      var args = arguments[0] || {},
          jitter = args.jitter || {},
          format = args.format || "json",
          params = args.params || {};
      
      var buildRequestParams = function(addlParams) {
        var requestParams = {};
        if(jitter.sinceID && self.trackSince) { requestParams.since_id = jitter.sinceID; }
        if(self.performSearch && options.query) { requestParams.q = options.query; }
        if(self.filteredUsers && options.users.length) { requestParams.q = $.map(options.users, function(item) { return "from:" + item; }).join(" OR "); }
        if(addlParams) { requestParams = $.extend(requestParams, addlParams); }
        return requestParams;
      };

      var buildURL = function(feedItem) {
        var url = feedItem.url.interpolate({format: format});
        
        if(feedItem.requiresUsername) { url = url.interpolate({username: options.username}); }
        if(feedItem.requiresPassword) { url = url.interpolate({password: options.password}); }

        var queryString = $.param(buildRequestParams(params));
        if(queryString.length) { url += "?" + queryString; }

        return url;
      };
      
      return buildURL(options.currentFeed);
    };
    
    return self;
  };
})(jQuery);
