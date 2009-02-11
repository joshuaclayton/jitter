(function($) {
  $.extend(String.prototype, {
    cssClassify: function(sep) {
      sep = sep || "-";
      return this.replace(/[^\x00-\x7F]+/, '')
        .replace(/[^\w\-_\+]+/g, sep)
        .replace(new RegExp(sep + "+"), sep)
        .replace(new RegExp("^" + sep + "|" + sep + "$"), '')
        .toLowerCase();
    },
    toCSSClass: function() { return (arguments[0] || "") + "." + this; },
    interpolate: function(obj) {
      var result = this;
      $.each(result.match(/\{\w+\}/g), function(i, item) {
        var k = item.replace(/\{|\}/g, '');
        if(obj[k]) { result = result.replace(new RegExp(item), obj[k]); }
      });
      return result;
    },
    strip: function() { return this.replace(/^ +| +$/g, ''); }
  });
  $.extend(Array.prototype, {
    compact: function() {
      var result = [];
      $.each(this, function(idx, item) {
        if(item === null) { return; }
        result.push(item);
      });
      return result;
    },
    uniq: function() {
      var resultArray = this.sort(function(a,b) { if(JSON.stringify(a) == JSON.stringify(b)) { return 0; } if(JSON.stringify(a) > JSON.stringify(b)) { return 1; } return -1; }),
          first = 0,
          last = resultArray.length;

      for(var alt; (alt = first) != last && ++first != last; ) {
        if(resultArray[alt] === resultArray[first] || JSON.stringify(resultArray[alt]) == JSON.stringify(resultArray[first])) {
          for(; ++first != last;) {
            if (resultArray[alt] !== resultArray[first] && JSON.stringify(resultArray[alt]) != JSON.stringify(resultArray[first])) { resultArray[++alt] = resultArray[first]; }
          }
          ++alt;
          resultArray.length = alt;
          return resultArray;
        }
      }

      return resultArray;
    },
    remove: function(obj) {
      if(typeof(obj) == "object") {
        var translatedThis = [];
        $.each(this, function(idx, item) {
          translatedThis.push(JSON.stringify(item));
        });
        var idx = translatedThis.indexOf(JSON.stringify(obj));
        if(idx != -1) { this.splice(idx, 1); }
      } else {
        this.splice(this.indexOf(obj), 1);
      }
      return this;
    }
  });
})(jQuery);

(function($) {
  $.twitter = {
    urls: {
      user: "http://twitter.com/{username}",
      status: "http://twitter.com/{username}/status/{id}"
    },
    domID: function(tweet) { return "tweet-{id}".interpolate({id: tweet.id}); },
    tweetURL: function(tweet) { return $.twitter.urls.status.interpolate({username: $.twitter.username(tweet), id: tweet.id}); },
    image: function(tweet) { return $("<img />").attr({src: (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url), width: 48, height: 48}); },
    timestamp: function(tweet) { return new Date(tweet.created_at).toUTCString(); },
    prettyTimestamp: function(tweet) { return $.prettyDate(tweet.created_at); },
    username: function(tweet) { return tweet.user ? tweet.user.screen_name : tweet.from_user; },
    displayName: function(tweet) { return tweet.user ? tweet.user.name : tweet.from_user; },
    userURL: function(tweet) {
      var username, displayName;
      
      if(typeof(tweet) == "object") {
        username    = $.twitter.username(tweet);
        displayName = $.twitter.displayName(tweet);
      } else if(typeof(tweet) == "string") {
        username    = tweet.replace(/\@/, '');
        displayName = tweet;
      }
      
      return $("<a />").attr({href: $.twitter.urls.user.interpolate({username: username}), target: "_blank"}).html(displayName);
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
    }
  };
})(jQuery);

(function($) {
  $.fn.outerHTML = function() { return $("<div/>").append(this.eq(0).clone()).html(); };
  $.guid = function() { return +new Date(); };
})(jQuery);

(function($) {
  $.prettyDate = function(time) {
    var date = new Date(time || ""),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) { return time; }
    
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
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings),
        self = {feed: $.jitter.feeds.process(options), settings: options},
        tweets = false;
    
    var updateTweets = function() {
      $.ajax({
        type: "GET",
        url: self.feed.url({jitter: self}),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }
          if(!!self.feed.trackSince && data[0]) { self.sinceID = data[0].id; }
          if(tweets) { data = data.reverse(); }
          $(document).trigger("jitter-success", {data: data, jitter: self});
          if(!tweets && data) { tweets = true; }
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
})(jQuery);
(function($) {
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
        })
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
(function($) {
  var triggerTweet = function(tweets, options) { $(document).trigger("jitter-tweet-read", $.extend({}, {tweets:tweets, markAsCurrent: true, scrollToCurrent: true}, options)); };
  var deleteTweet = function(tweets, options) { $(document).trigger("jitter-tweet-delete", $.extend({}, {tweets:tweets}, options)); };
  
  var buildReadSelector = function(options, args) {
    var selector = "#tweets .feed-wrapper",
        opts = $.extend({}, {visible: true}, options);
    
    if(opts.feed) {
      if(typeof(opts.feed) === "function") { opts.feed = opts.feed(); }
      if(typeof(opts.feed) === "string") {
        selector += opts.feed;
      } else if(opts.feed.className) {
        selector += opts.feed.className.toCSSClass();
      }
    }
    
    if(opts.visible) { selector += ":visible"; }
    return selector += " div.tweet" + (args ? args.suffix : "");
  };
  
  $.jitter.window = {
    jitters: [],
    loggable: function() { return window.console && window.console.log; },
    container: function() { return $("#content"); },
    loadFromCookieJar: function() {
      if(!$.cookieJar) { return; }
      $.each($.cookieJar.get("jitters"), function(idx, settings) {
        if($.jitter.window.jitters.indexOf($.jitter.feeds.process(settings).className) == -1) {
          var newJitter = $.jitter(settings).start();
          if(!$.jitter.window.currentJitter()) { $.jitter.window.currentJitter(newJitter); }
        }
      });
    },
    currentJitter: function() {
      return arguments.length ? $(document).data("jitter-current", arguments[0]) : $(document).data("jitter-current");
    },
    currentFeed: function() { if($.jitter.window.currentJitter()) { return $.jitter.window.currentJitter().feed; } },
    currentlyFilteredToFeed: function(feed) { return $.jitter.window.currentFeed() === feed; },
    currentlyFilteredToAll: function() { return $.jitter.window.currentFeed() === null; },
    currentlyFilteredClass: function() {
      if($.jitter.window.currentFeed()) { return $.jitter.window.currentFeed().className.toCSSClass(); }
      return "";
    },
    refreshTimestamps: function() {
      $("div.timestamp:visible").each(function(idx, item) {
        $(item).html($.prettyDate($(item).attr("title")));
      });
    },
    unread: function() {
      var filter = arguments[0] || null,
          options = $.extend({}, {onlyFilter: false}, (arguments[1] || {}));
      
      return {
        increase: function(count) {
          if(!options.onlyFilter === true) { $(document).data("jitter-unread", ($(document).data("jitter-unread") || 0) + count); }
          if(filter) { $(document).data("jitter-unread-" + filter, ($(document).data("jitter-unread-" + filter) || 0) + count); }
          return count;
        },
        decrease: function(count) {
          if(!options.onlyFilter === true) { $(document).data("jitter-unread", $(document).data("jitter-unread") - count); }
          if(filter) { $(document).data("jitter-unread-" + filter, $(document).data("jitter-unread-" + filter) - count); }
          return count;
        },
        empty: function() {
          if(filter) {
            var unreadCountHandle = "jitter-unread-" + filter,
                unreadCount = $(document).data(unreadCountHandle);
            $(document).data(unreadCountHandle, 0);
            $(document).data("jitter-unread", $(document).data("jitter-unread") - unreadCount);
          }
          return 0;
        },
        count: function() { return filter ? $(document).data("jitter-unread-" + filter) : $(document).data("jitter-unread"); }
      };
    },
    build: {
      tweet: function(tweet, jitter) {
        var feed = jitter.feed;
        return $('\
          <div class="tweet clearfix">\
            <div class="meta span-5">\
              <div class="author">\
                <div class="tweetImage span-2"/><div class="displayName span-3 last"/>\
              </div>\
              <div class="createdAt timestamp"/>\
              <div class="backtrack"/>\
            </div>\
            <div class="tweetBody span-11 last"/>\
          </div>')
          .attr("id", $.twitter.domID(tweet))
          .data("jitter", jitter)
          .click(function() {
            $(document).trigger("jitter-tweet-read", {tweets: $(this), markAsCurrent: true, scrollToCurrent: true});
          })
          .find(".tweetBody").html($.twitter.linkedText(tweet)).end()
          .find(".author .displayName").html($.twitter.userURL(tweet)).end()
          .find(".author .tweetImage").append($.twitter.image(tweet)).end()
          .find(".createdAt")
            .html($.twitter.prettyTimestamp(tweet))
            .attr("title", $.twitter.timestamp(tweet))
            .end();
      },
      filter: function(jitter) {
        var feed = jitter.feed;
        
        return $('\
          <div class="jitter-filter">\
            <a class="twitter-rss"><img src="images/rss.png" /></a>\
            <a class="show-filter"></a>\
            <a class="delete-filter"><img src="images/delete.png" /></a>\
          </div>')
          .addClass(feed.className)
          .find(".twitter-rss")
            .attr({href: feed.url({format: "rss"}), target: "_blank"}).end()
          .find(".show-filter")
            .html(feed.title)
            .attr({href: "#"})
            .click(function() { $.jitter.window.currentJitter(jitter); return false; }).end()
          .find(".delete-filter")
            .attr({href: "#"})
            .click(function() { jitter.stop(); return false; }).end();
      },
      initialPage: function() {
        if(!$.jitter.window.container()) { return; }
        $.jitter.window.container().append("\
          <div class='span-8 sidebar'>\
            <div class='header span-8 last'><h1>Jitter</h1></div>\
            <div class='jitter-filters span-8 last'/>\
          </div>\
          <div id='tweets' class='span-16 prepend-8'/>\
          <div id='tweets-archive' class='span-16 prepend-8'/>")
          .find(".sidebar")
            .append($.jitter.window.build.keyboardCheatSheet()).end();
      },
      keyboardCheatSheet: function() {
        var $wrapper = $("<div class='cheatsheet clearfix'><h3>Keyboard Cheatsheet</h3><dl></dl></div>");
        $.each($.jitter.keyboard.mappings, function(key, val) {
          var $dt = $("<dt/>").html(val.key || key),
              $dd = $("<dd/>").html(val.description);
          $wrapper.find("dl").append($dt).append($dd);
        });
        return $wrapper;
      },
      feedForm: function(feed) {
        var uniqueId = $.guid();
        
        feed = $.jitter.feeds[feed];
        if(!feed || typeof(feed) != "object") { return; }
        
        var $fieldset = $("<fieldset/>").append("<legend>" + feed.simpleTitle + "</legend>"),
          $form = $("<form />")
            .attr({method: "#"})
            .submit(function() {
              var $this = $(this);
              var username  = $this.find("input[name=username]").val(),
                  password  = $this.find("input[name=password]").val(),
                  groupName = $this.find("input[name=groupName]").val(),
                  users     = $this.find("input[name=users]").val(),
                  query     = $this.find("input[name=query]").val();
              
              if(users) { users = users.split(/ *, */); }
              var options = {};
              
              if(feed.requiresUsername) { options.username = username; }
              if(feed.requiresPassword) { options.password = password; }
              if(feed.performSearch)    { options.query = query; }
              if(feed.filteredUsers)    { options.groupName = groupName; options.users = users; }
              
              options.feed = feed;
              $.jitter(options).start();
              $this.find("input:not([type=submit])").val("");
              $this.find("input").blur();
              return false;
            });
        
        var buildInputs = function(name, title) {
          $fieldset
            .append(
              $("<label/>")
                .attr({"for": (name + "-" + uniqueId)})
                .html(title)
            )
            .append(
              $("<input/>")
                .attr({type: "text", name: name, id: name + "-" + uniqueId})
            );
        };
        
        if(feed.requiresUsername) { buildInputs("username", "Username"); }
        if(feed.requiresPassword) { buildInputs("password", "Password"); }
        if(feed.filteredUsers)    { buildInputs("groupName", "Group Name"); buildInputs("users", "Users"); }
        if(feed.performSearch)    { buildInputs("query", "Search"); }
        
        return $form.append($fieldset.append("<input type='submit' name='Add Feed' />"));
      }
    },
    tweets: {
      read: function(options) {
        var selector = buildReadSelector(options, {suffix: ":not(.tweet-read)"});
        triggerTweet($(selector), {markAsCurrent: false, scrollToCurrent: false});
      },
      archive: function(options) {
        var selector = buildReadSelector(options);
        $(document).trigger("jitter-tweet-archive", {tweets: $(selector)});
      },
      current: {
        scrollTo:       function() { $(document).scrollTo($("#tweets .feed-wrapper:visible div.tweet.current"), 200); },
        setToFirst:     function() { triggerTweet($("#tweets .feed-wrapper:visible div.tweet:visible:first")); },
        setToNext:      function() { triggerTweet($("#tweets .feed-wrapper:visible div.tweet.current").nextAll(":visible:first")); },
        setToPrevious:  function() { triggerTweet($("#tweets .feed-wrapper:visible div.tweet.current").prevAll(":visible:first")); },
        setToLast:      function() { triggerTweet($("#tweets .feed-wrapper:visible div.tweet:visible:last")); },
        openLinks: function() { $("div.tweet.current div.tweetBody a").each(function(idx, anchor) { window.open($(anchor).attr("href"), "_blank"); }); },
        openAuthorTwitterLink: function() { window.open($("div.tweet.current div.author div.displayName a").attr("href"), "_blank"); }
      }
    }
  };
})(jQuery);
(function($) {
  $.jitter.keyboard = {
    enable: function() {
      $(document).data("keyboard-enabled", true);
      if($(document).data("keyboard-bound")) { return; }
      
      $(document).keydown(function(e) {
        if($(document).data("keyboard-enabled") === false) { return; }
        if (/(input|textarea|select)/i.test(e.target.nodeName)) { return; }
        
        var keyPressed = String.fromCharCode(e.which),
            mappedKeyboardAction = $.jitter.keyboard.mappings[keyPressed] || $.jitter.keyboard.mappings[e.which];
        
        if(mappedKeyboardAction) {
          e.preventDefault();
          mappedKeyboardAction.fn.apply(this, mappedKeyboardAction.args);
        }
      });
      
      $(document).data("keyboard-bound", true);
    },
    disable: function() { $(document).data("keyboard-enabled", false); },
    mappings: {
      "E": {
        fn: $.jitter.window.tweets.read,
        args: [{visible: true, feed: $.jitter.window.currentFeed}],
        description: "Mark all visible tweets as read"
      },
      "A": {
        fn: $.jitter.window.tweets.archive,
        args: [{visible: true, feed: $.jitter.window.currentFeed}],
        description: "Archive all visible tweets"
      },
      "O": {
        fn: $.jitter.window.tweets.current.openAuthorTwitterLink,
        description: "Open current tweet author's Twitter page"
      },
      "P": {
        fn: $.jitter.window.tweets.current.openLinks,
        description: "Open all links within current tweet"
      },
      "37": {
        fn: $.jitter.window.tweets.current.setToFirst,
        description: "Navigate to first tweet",
        key: "&larr;"
      },
      "38": {
        fn: $.jitter.window.tweets.current.setToPrevious,
        description: "Navigate to previous tweet",
        key: "&uarr;"
      },
      "39": {
        fn: $.jitter.window.tweets.current.setToLast,
        description: "Navigate to last tweet",
        key: "&rarr;"
      },
      "40": {
        fn: $.jitter.window.tweets.current.setToNext,
        description: "Navigate to next tweet",
        key: "&darr;"
      }
    }
  };
})(jQuery);
(function($) {
  $.jitter.bindings = function() {
    $(document).bind("jitter-tweet-read", function(event, info) {
      if(!info.tweets.length) { return; }
      
      var currentSiblings = info.tweets.siblings();
      if(currentSiblings.length) { currentSiblings.removeClass('current'); }
      
      info.tweets.filter(":not(.read)").addClass("read");
      
      if(info.markAsCurrent)    { info.tweets.addClass("current"); }
      if(info.scrollToCurrent)  { $.jitter.window.tweets.current.scrollTo(); }
    });
    
    $(document).bind("jitter-tweet-archive", function(event, info) {
      if(!info.tweets.length) { return; }
      $(document).trigger("jitter-tweet-read", {tweets: info.tweets});
      info.tweets.appendTo($("#tweets-archive").find($(info.tweets[0]).data("jitter").feed.className.toCSSClass("div")));
    });
    
    $(document).bind("jitter-tweet-delete", function(event, info) { info.tweets.remove(); });
    
    $(document).bind("jitter-success", function(event, info) {
      var tweets = info.data,
          $target = $.jitter.window.container();
      
      if(!$target || !tweets.length) { return; }
      
      var $wrapper = $("<div/>");
      $.each(tweets, function(index, tweet) {
        $.jitter.window.build.tweet(tweet, info.jitter).appendTo($wrapper);
      });
      
      if(!$target.find("#tweets").find(info.jitter.feed.className.toCSSClass("div")).length) {
        var $feedWrapper = $("<div/>")
          .addClass(info.jitter.feed.className)
          .addClass("feed-wrapper span-16 last");
        
        if(!$.jitter.window.currentlyFilteredToFeed(info.jitter.feed)) { $feedWrapper.hide(); }
        $feedWrapper.appendTo($("#tweets")).clone().appendTo($("#tweets-archive"));
      }
      
      var $tweetElements = $wrapper.children()[$("#tweets").find(info.jitter.feed.className.toCSSClass("div")).find(".tweet").length ? "prependTo" : "appendTo"]($target.find("#tweets").find(info.jitter.feed.className.toCSSClass("div")));
      
      if($.jitter.window.currentlyFilteredToFeed(info.jitter.feed) || $.jitter.window.currentlyFilteredToAll()) {
        $tweetElements.fadeIn("slow");
        $.jitter.window.tweets.current.scrollTo();
      }
    });
    
    $(document).bind("jitter-success", function(event, info) {
      if(!info.data.length) { return; }
      $.jitter.window.unread(info.jitter.feed.className).increase(info.data.length);
    });
    
    $(document).bind("jitter-tweet-read", function(event, info) {
      var $unreadTweets = info.tweets.filter(":not(.tweet-read)");
      
      if(!$unreadTweets.length) { return; }
      
      if($unreadTweets.filter($.jitter.window.currentlyFilteredClass()).length === $unreadTweets.length && $.jitter.window.currentFeed()) {
        $.jitter.window.unread($.jitter.window.currentFeed().className, {onlyFilter: true}).decrease($unreadTweets.length);
      } else {
        $unreadTweets.each(function(itx, tweet) {
          $.jitter.window.unread($(tweet).data("jitter").feed.className, {onlyFilter: true}).decrease(1);
        });
      }
      
      $.jitter.window.unread().decrease($unreadTweets.length);
      $unreadTweets.addClass("tweet-read");
    });
    
    $(document).bind("jitter-started", function(event, info) {
      $.jitter.window.jitters.push(info.jitter.feed.className);
      
      $.jitter.window.build.filter(info.jitter)
        .bind("setData", function(e, key, val) {
          if(key === "unreadCount") {
            var $this = $(this);
            if(!$this.find(".unreadCount").length) {
              $("<span class='unreadCount'/>").html(val).appendTo($this);
            } else {
              $this.find(".unreadCount").html(val);
            }
            if(val === 0) { $this.find(".unreadCount").remove(); }
          }
        })
        .appendTo($(".jitter-filters"));
    });
    
    $(document).bind("jitter-stopped", function(event, info) {
      $.jitter.window.jitters.splice($.jitter.window.jitters.indexOf(info.jitter.feed.className), 1);
      $("#tweets").find(info.jitter.feed.className.toCSSClass("div")).remove();
      $("#tweets-archive").find(info.jitter.feed.className.toCSSClass("div")).remove();
      $(info.jitter.feed.className.toCSSClass(".jitter-filter")).remove();
      $.jitter.window.unread(info.jitter.feed.className).empty();
    });
    
    $(document).bind("jitter-started", function(event, info) {
      if(!$.cookieJar) { return; }
      var jitters = $.cookieJar.get("jitters") || [];
      jitters.push(info.jitter.settings);
      $.cookieJar.set("jitters", jitters.compact().uniq());
    });
    
    $(document).bind("jitter-stopped", function(event, info) {
      if(!$.cookieJar) { return; }
      var jitters = $.cookieJar.get("jitters");
      jitters.remove(info.jitter.settings);
      $.cookieJar.set("jitters", jitters.compact().uniq());
    });
    
    $(document).bind("jitter-change", function(event, info) {
      if(info.jitter.feed.className) {
        $("#tweets .feed-wrapper:visible")
          .fadeOut("fast", function() { $(this).find(".current").removeClass("current"); });
        $("#tweets")
          .find(info.jitter.feed.className.toCSSClass("div"))
            .css({"left": "700px"}).show()
            .animate({"left": 0}, 800, "easeOutBounce");
        $(".jitter-filter").removeClass("active").filter(info.jitter.feed.className.toCSSClass()).addClass("active");
      } else {
        $("#tweets .feed-wrapper:hidden").show();
      }
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
          if($(className.toCSSClass(".jitter-filter"))) {
            $(className.toCSSClass(".jitter-filter")).data("unreadCount", val);
          }
        }
      }
    });
    
    $(document).bind("setData", function(e, key, val) {
      if(/^jitter-current$/.test(key)) { $(document).trigger("jitter-change", {jitter: val}); }
    });
    
    $(document).ready(function() {
      $.timer(60 * 1000, function(t) { $.jitter.window.refreshTimestamps(); });
    });
  };
})(jQuery);
