String.prototype.cssClassify = function(sep) {
  sep = sep || "-";
  return this.replace(/[^\x00-\x7F]+/, '')
    .replace(/[^\w\-_\+]+/g, sep)
    .replace(new RegExp(sep + "+"), sep)
    .replace(new RegExp("^" + sep + "|" + sep + "$"), '')
    .toLowerCase();
};

String.prototype.interpolate = function(obj) {
  var result = this,
      matches = result.match(/\{\w+\}/g);
  $.each(matches, function(i, item) {
    var k = item.replace(/\{|\}/g, '');
    if(obj[k]) {
      result = result.replace(new RegExp(item), obj[k]);
    }
  });
  return result;
};

String.prototype.strip = function() {
  return this.replace(/^ +| +$/g, '');
};

(function($) {
  $.twitter = {
    urls: {
      user: "http://twitter.com/{username}",
      status: "http://twitter.com/{username}/status/{id}"
    },
    userURL: function(tweet) {
      var username, displayName;
      
      if(typeof(tweet) == "object") {
        username    = $.twitter.username(tweet);
        displayName = $.twitter.displayName(tweet);
      } else if(typeof(tweet) == "string") {
        username = tweet.replace(/\@/, '');
        displayName = tweet;
      }
      
      return $("<a />").attr({href: $.twitter.urls.user.interpolate({username: username}), target: "_blank"}).html(displayName);
    },
    tweetURL: function(tweet) {
      return $.twitter.urls.status.interpolate({username: $.twitter.username(tweet), id: tweet.id});
    },
    image: function(tweet) {
      return $("<img />").attr({src: (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url), width: 48, height: 48});
    },
    linkedText: function(tweet) {
      var text = tweet.text,
          urlMatches = text.match(/https?\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!]/g),
          twitterReplies = text.match(/(\@\w+)/g);
      
      if(urlMatches) {
        $.each(urlMatches, function(idx, item) {
          text = text.replace(RegExp(item, "g"), $("<a/>").attr({href: item, target: "_blank"}).html(item).outerHTML());
        });
      }
      
      if(twitterReplies) {
        $.each(twitterReplies, function(idx, item) {
          text = text.replace(RegExp(item, "g"), $.twitter.userURL(item).outerHTML());
        });
      }
      
      return text;
    },
    timestamp: function(tweet) {
      return new Date(tweet.created_at).toUTCString();
    },
    prettyTimestamp: function(tweet) {
      return $.prettyDate(tweet.created_at);
    },
    username: function(tweet) {
      return tweet.user ? tweet.user.screen_name : tweet.from_user;
    },
    displayName: function(tweet) {
      return tweet.user ? tweet.user.name : tweet.from_user;
    }
  };
})(jQuery);

(function($) {
  $.fn.outerHTML = function() {
    return $("<div/>").append(this.eq(0).clone()).html();
  };
  
  $.fn.defaultValueActsAsHint = function() {
    var handleItem = function(idx, item) {
      var $item = $(item);
      $item
        .data("defaultValue", $item.val())
        .addClass("hint")
        .focus(function() {
          if($(this).data("defaultValue") != $(this).val()) { return; }
          $(this).removeClass("hint").val("");
        }).blur(function() {
          if($(this).val().strip() != "") { return; }
          $(this).addClass("hint").val($(this).data("defaultValue"));
        });
    };
    
    var $inputs = $("<div/>").append(this).find("input");
    var $textareas = $("<div/>").append(this).find("textarea");
    
    $.each($inputs, handleItem);
    $.each($textareas, handleItem);
    
    return this;
  };
})(jQuery);

(function($) {
  $.prettyDate = function(time) {
    var date = new Date(time || ""),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
      return time;

    return day_diff == 0 && (
        diff < 60 && "just now" ||
        diff < 120 && "1 minute ago" ||
        diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
        diff < 7200 && "1 hour ago" ||
        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
      day_diff == 1 && "Yesterday" ||
      day_diff < 7 && day_diff + " days ago" ||
      day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
  };
})(jQuery);

(function($) {
  $.log = function(text) {
    if(window.console) {
      window.console.log(text);
    } else {
      alert(text);
    }
  };
})(jQuery);(function($) {
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings),
        self = {feed: $.jitter.feeds.process(options)};
    
    var updateTweets = function() {
      $.ajax({
        type: "GET",
        url: self.feed.url({jitter: self}),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }
          if(!!self.feed.trackSince && data[0]) { self.sinceID = data[0].id; }
          $(document).trigger("jitter-success", {data: data, jitter: self});
        }
      });
    };
    
    self.start = function() {
      $(document).trigger("jitter-started", {jitter: self});
      updateTweets();
      
      if(!self.timer) {
        self.timer = $.timer(1000 * options.refreshRate, function(t) { updateTweets(); });
        this.stop = function() { $(document).trigger("jitter-stopped", {jitter: self}); self.timer.stop(); return self; };
      }
      return self;
    };
    
    return self;
  };
})(jQuery);(function($) {
  $.jitter.defaults = {
    refreshRate: 60,
    feed: "search",
    query: "jquery"
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
    },
    process: function(options) {
      options.currentFeed = typeof(options.feed) === "string" ? $.jitter.feeds[options.feed] : options.feed;
      var self = {
        performSearch:  options.currentFeed.performSearch,
        trackSince:     options.currentFeed.trackSince,
        simpleTitle:    options.currentFeed.simpleTitle
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
        $(document).trigger("jitter-feedError", error);
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
    }
  };
})(jQuery);
// tweet read handler;
$(document).bind("jitter-tweet-read", function(event, info) {
  info.tweets.siblings(".current").removeClass("current").end().addClass("read");
  if(info.markAsCurrent)    { info.tweets.addClass("current"); }
  if(info.scrollToCurrent)  { $(document).scrollTo($("div.tweet.current"), 200); }
});

// building tweet HTML / appending to document
$(document).bind("jitter-success", function(event, info) {
  var tweets = info.data,
      $target = $.jitter.window.container();
  
  if(!$target) { return; }
  
  if(tweets.length) {
    var $wrapper = $("<div/>");
    $.each(tweets, function(index, tweet) {
      $.jitter.window.build.tweet(tweet, info.jitter).appendTo($wrapper);
    });
    
    var $tweetElements = $wrapper.children().hide().prependTo($target.find(".tweets"));
    
    if($.jitter.window.currentlyFilteredToFeed(info.jitter.feed) || $.jitter.window.currentlyFilteredToAll()) {
      $tweetElements.fadeIn("slow");
    }
  }
});

// refresh timestamps and update unread counts
$(document).bind("jitter-success", function(event, info) {
  $.jitter.window.refreshTimestamps();
  $(document).data("jitter-unread", ($(document).data("jitter-unread") || 0) + info.data.length);
  $(document).data("jitter-unread-" + info.jitter.feed.className, ($(document).data("jitter-unread-" + info.jitter.feed.className) || 0) + info.data.length);
});

// tweet read/unread count
$(document).bind("jitter-tweet-read", function(event, info) {
  $.each(info.tweets, function(index, tweet) {
    if($(tweet).data("tweet-read") === true) { return; }
    var unreadCountHandle = "jitter-unread-" + $(tweet).data("jitter").feed.className,
        unreadCount = $(document).data(unreadCountHandle);
    $(tweet).data("tweet-read", true);
    $(document).data("jitter-unread", $(document).data("jitter-unread") - 1);
    $(document).data(unreadCountHandle, unreadCount - 1);
  });
});

// create filter link when jitter starts
$(document).bind("jitter-started", function(event, info) {
  $.jitter.window.build.filter(info.jitter).appendTo($(".jitter-filters"));
});

$(document).bind("jitter-change", function(event, info) {
  if(info.jitter.feed.className) {
    $("div.tweet:not(." + info.jitter.feed.className + ")").hide();
    $("div.tweet." + info.jitter.feed.className).show();
  } else {
    $("div.tweet").show();
  }
  $.jitter.window.tweets.current.setToFirst();
});

$(document).bind("setData", function(e, key, val) {
  if(/^jitter-unread$/.test(key)) {
    var $title = $("head title"),
        strippedTitle = $title.html().replace(/\s+\(.+\)/, '');
    $title.html(strippedTitle + " (" + val + ")");
    
    if(window.document.title) { window.document.title = $title.html(); }
    if(window.fluid)          { window.fluid.dockBadge = val ? val : null; }
  } else if(/^jitter-unread\-(.+)$/.test(key)) {
    var matches = key.match(/^jitter-unread\-(.+)$/);
    if(matches){
      var className = matches[1];
      if($(".jitter-filter." + className)) {
        $(".jitter-filter." + className).data("unreadCount", val);
      }
    }
  }
});

$(document).bind("setData", function(e, key, val) {
  if(/^jitter-current$/.test(key)) {
    $(document).trigger("jitter-change", {jitter: val});
  }
});