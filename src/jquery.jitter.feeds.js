(function($) {
  $.jitter.feeds = {
    publicTimeline: {
      url: "http://twitter.com/statuses/public_timeline.{format}",
      name: "public",
      simpleTitle: "Public Timeline",
      title: "Public Timeline"
    },
    friendsTimeline: {
      url: "http://twitter.com/statuses/friends_timeline.{format}",
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
      url: "http://twitter.com/direct_messages.{format}",
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
    },
    process: function(options) {
      options = $.extend({}, {groupName: "", query: "", username: "", password: ""}, options);
      options.currentFeed = typeof(options.feed) === "string" ? $.jitter.feeds[options.feed] : options.feed;
      
      var self = {
        simpleTitle: options.currentFeed.simpleTitle,
        trackSince: options.currentFeed.trackSince,
        className: options.currentFeed.name.interpolate({
          username: options.username,
          query: options.query.cssClassify(),
          groupName: options.groupName.cssClassify()
        }),
        title: options.currentFeed.title.interpolate({
          username: options.username,
          query: options.query,
          groupName: options.groupName
        }),
        requiresUsername: options.currentFeed.requiresUsername,
        requiresPassword: options.currentFeed.requiresPassword
      };
      
      try {
        if(options.currentFeed == $.jitter.feeds.search && !options.query) { throw($.jitter.errors.invalidSearchRequest); }
        if(options.currentFeed == $.jitter.feeds.groupTimeline && (!options.users || (options.users && !options.users.length) || !options.groupName)) { throw($.jitter.errors.invalidGroupTimelineRequest); }
        if(options.currentFeed == $.jitter.feeds.userTimeline && !options.username) { throw($.jitter.errors.invalidUserTimelineRequest); }
      } catch(error) {
        $(document).trigger("jitter-feedError", error);
        return;
      }
      
      self.url = function() {
        var args = arguments[0] || {},
            jitter = args.jitter || {},
            format = args.format || "json",
            params = args.params || {lang: "en"};
        
        var buildRequestParams = function(addlParams) {
          var requestParams = {};
          if(jitter.sinceID && options.currentFeed.trackSince) { requestParams.since_id = jitter.sinceID; }
          if(options.currentFeed.performSearch && options.query) { requestParams.q = options.query; }
          if(options.currentFeed.filteredUsers && options.users.length) { requestParams.q = $.map(options.users, function(item) { return "from:" + item; }).join(" OR "); }
          if(addlParams) { requestParams = $.extend({}, requestParams, addlParams); }
          return requestParams;
        };
        
        var buildURL = function(feedItem) {
          var url = feedItem.url.interpolate({
              format: format,
              username: options.username,
              password: options.password
            }),
            queryString = $.param(buildRequestParams(params));
            
          if(queryString.length) { url += "?" + queryString; }
          return url;
        };
        
        return buildURL(options.currentFeed);
      };
      
      return self;
    }
  };
})(jQuery);
