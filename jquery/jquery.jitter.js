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

          if(options.currentFeed.trackSince === true && data[0]) { jitter.sinceID = data[0].id; }    // set sinceID to the 'newest' tweet in the results
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
})(jQuery);(function($) {
  $.jitter.defaults = {
    refreshRate: 60,
    feed: "search",
    query: "jquery",
    onUpdate: function(tweets) { if(tweets[0]) { alert("Newest Tweet:\n" + tweets[0].text); } else { alert("No new tweets, sorry!"); } },
    onError: function(error) { alert("Error: " + error.name + "\nMessage: " + error.message); }
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
      name: "group-{groupName}",
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
(function($) {
  $.jitter.builder = function(target, options) {
    var builder = {},
        self = {};
    options = options || {};
    
    var showTweetCount = function(anchor) {
      var ct = $(anchor).data("unreadCount");
      return (ct > 20 ? ct : 20);
    };
    
    var showTweets = function(tweetsParent, tweetClass, numberOfTweetsToDisplay) {
      tweetsParent.find(".tweet").hide();
      tweetsParent.find(tweetClass + ":lt(" + numberOfTweetsToDisplay + ")").show();
    };
    
    var readFilterLink = function(anchor) {
      var $anchor = $(anchor);
      $anchor.data("unreadCount", 0);
    };
    
    var triggerFilterLink = function(anchor) {
      var $anchor = $(anchor);
      $anchor.parent().children().removeClass("active");
      $anchor.
        addClass("active").
        attr("displayTweets", "." + $anchor.attr("id"));
      readFilterLink(anchor);
      
      showTweets(target, "." + $anchor.attr("id"), showTweetCount($anchor));
    };
    
    var handleTweets = function(tweets) {
      var currentlyFilteredToSelf = target.find(".jitter-filters a.active").attr("id").indexOf(builder.cssClass) >= 0;
      var currentlyFilteredToAll = target.find(".jitter-filters a.active").length ? (target.find(".jitter-filters a.active").attr("class").match("allTweets") ? true : false) : false;
      
      if(tweets.length) {
        var wrapper = $("<div/>");
        
        $.each(tweets, function(index, tweet) {
          var tweetWrapper = 
            $("<div class='tweet clearfix'/>").
              addClass(builder.cssClass).
              addClass("author-" + (tweet.user ? tweet.user.screen_name : tweet.from_user));
          var tweetBody = $("<div class='tweetBody'/>").html($.linkTwitterUsernames(tweet.text));
          var author = 
            $("<div class='author'/>").
              append($("<span class='displayName'/>").html($.twitterURL(tweet))).
              append($.twitterImage(tweet));
          
          var createdAt = 
            $("<div class='createdAt'></div>").
              html(new Date(tweet.created_at).toUTCString());
          
          tweetWrapper.
            append(author).
            append(tweetBody).
            append(createdAt).
            appendTo(wrapper);
        });
        
        var tweetElements = $(wrapper.html()).hide();
        
        if(target.find(".tweet").length) {
          target.find(".tweets").prepend(tweetElements);
          if(currentlyFilteredToSelf || currentlyFilteredToAll) {
            tweetElements.fadeIn("slow");
          } else {
            var correspondingAnchor = $("a#" + builder.cssClass);
            var num = Number(correspondingAnchor.data("unreadCount")) + tweets.length;
            if(num) { correspondingAnchor.data("unreadCount", num); }
          }
        } else {
          target.find(".tweets").append(tweetElements);
        }
      }
      
      if(currentlyFilteredToSelf) {
        showTweets(target, "." + builder.cssClass, showTweetCount("#" + builder.cssClass));
      } else if(currentlyFilteredToAll) {
        showTweets(target, ".tweet", 40);
      }
    };
    
    options.onUpdate = function(tweets) { handleTweets(tweets); };
    builder.jitter = $.jitter(options);
    builder.cssClass = builder.jitter.feedClass();
    builder.feedTitle = builder.jitter.feedTitle();
    
    var filterLink = 
      $("<a/>").
        html(builder.feedTitle).
        attr({
          href: "#",
          id: builder.cssClass
        }).
        click(function() { 
          triggerFilterLink(this);
        }).
        observeData().
        bind("unreadCountChanged", function(e, data) {
          var $this = $(this);
          if(!$this.find(".unreadCount").length) {
            $("<span class='unreadCount'/>").
              html(data.to).
              appendTo($this);
          } else {
            $this.
              find(".unreadCount").
              html(data.to);
          }
          if(data.to === 0) { $this.find(".unreadCount").remove(); }
        }).
        data("unreadCount", 0).
        appendTo(target.find(".jitter-filters"));
      
    self.showTweets = showTweets;
    self.showTweetCount = showTweetCount;
    return self;
  };
})(jQuery);(function($) {
  $.twitterURL = function(tweet) {
    var username, displayName;
    
    if(typeof(tweet) === "object") {
      username    = tweet.user ? tweet.user.screen_name : tweet.from_user;
      displayName = tweet.user ? tweet.user.name : tweet.from_user;
    } else if(typeof(tweet) === "string") {
      username = tweet.replace(/\@/, '');
      displayName = tweet;
    }
    
    return $("<a/>").
      attr("href", "http://twitter.com/" + username).
      html(displayName);
  };
  
  $.twitterImage = function(tweet) {
    return $("<img/>").attr("src", (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url));
  };
  
  $.linkTwitterUsernames = function(text) {
    var urlMatches = text.match(/https?\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!]/g);
    if(urlMatches) {
      $.each(urlMatches, function(idx, item) {
        text = text.replace(RegExp(item, "g"), '<a href="' + item + '">' + item + '</a>');
      });
    }
    
    var twitterReplies = text.match(/(\@\w+)/g);
    
    if(twitterReplies) {
      $.each(twitterReplies, function(idx, item) {
        text = text.replace(RegExp(item, "g"), $.twitterURL(item).outerHTML());
      });
    }
    
    return text;
  };
  
  $.fn.outerHTML = function() {
    return $("<div/>").append(this.eq(0).clone()).html();
  };
})(jQuery);

(function($) {
  var binder = function(e, dataKey, dataValue) {
    var $this = $(this),
        oldValue = $this.data(dataKey),
        newValue = dataValue,
        passed = {
          attr: dataKey,
          from: oldValue,
          to:   newValue
        };
    if(oldValue !== newValue) { $this.trigger(dataKey + "Changed", passed); $this.trigger("dataChanged", passed); }
  };
  
  $.fn.observeData = function() {
    return $(this).each(function() {
      $(this).bind("setData", binder);
    });
  };
})(jQuery);(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".jitter-filters").length) {
      var filters = $("<div class='jitter-filters span-6'/>");
      
      var filterAll = 
        $("<a/>").
          html("All Feeds").
          attr({href: "#", id: "tweets"}).
          addClass("active allTweets");
      filters.append(filterAll);
      target.prepend(filters);
    }
    
    if(!target.find(".tweets").length) {
      target.append($("<div class='tweets span-18 last'/>"));
    }
    
    var builder = $.jitter.builder(target, options);
    
    $(".allTweets").click(function() {
      var $this = $(this);
      $this.parent().children().removeClass("active");
      $this.
        addClass("active").
        attr("displayTweets", ".tweet");
      builder.showTweets(target, $this.attr("displayTweets"), builder.showTweetCount($this));
    });
    
    return target;
  };
})(jQuery);