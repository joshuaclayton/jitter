String.prototype.cssClassify = function(sep) {
  sep = sep || "-";
  var result = this;
  return result.replace(/[^\x00-\x7F]+/, '')
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

(function($) {
  $.twitter = {
    urls: {
      user: "http://twitter.com/{username}",
      status: "http://twitter.com/{username}/status/{id}"
    },
    userURL: function(tweet) {
      var username, displayName;

      if(typeof(tweet) === "object") {
        username    = $.twitter.username(tweet);
        displayName = $.twitter.displayName(tweet);
      } else if(typeof(tweet) === "string") {
        username = tweet.replace(/\@/, '');
        displayName = tweet;
      }

      return $("<a/>").attr("href", $.twitter.urls.user.interpolate({username: username})).html(displayName);
    },
    tweetURL: function(tweet) {
      return $.twitter.urls.status.interpolate({username: $.twitter.username(tweet), id: tweet.id});
    },
    image: function(tweet) {
      return $("<img/>").attr("src", (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url));
    },
    linkedText: function(tweet) {
      var text = tweet.text,
          urlMatches = text.match(/https?\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!]/g);
      if(urlMatches) {
        $.each(urlMatches, function(idx, item) {
          text = text.replace(RegExp(item, "g"), '<a href="' + item + '">' + item + '</a>');
        });
      }

      var twitterReplies = text.match(/(\@\w+)/g);

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
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings);
    if(typeof(options.feed) === "string") {
      options.currentFeed = $.jitter.feeds[options.feed];
    } else {
      options.currentFeed = options.feed;
    }
    
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
      var newOptions = $.extend({}, options, urlOptions);
      
      if(feedItem.requiresUsername) { url = url.interpolate({username: newOptions.username}); }
      if(feedItem.requiresPassword) { url = url.interpolate({password: newOptions.password}); }

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

        self.restart = function() {
          jitter.timer.reset(calculateRefreshRate());
        };
      }
    };
    
    // public instance methods
    var feedClass = function() {
      var feedClassName = options.currentFeed.name;
      if(options.currentFeed.requiresUsername)  { feedClassName = feedClassName.interpolate({username: options.username}); }
      if(options.currentFeed.performSearch)     { feedClassName = feedClassName.interpolate({query: options.query.cssClassify()}); }
      if(options.currentFeed.filteredUsers)     { feedClassName = feedClassName.interpolate({groupName: options.groupName.cssClassify()}); }
      return feedClassName;
    };

    var feedTitle = function() {
      var feedTitleName = options.currentFeed.title;
      if(options.currentFeed.requiresUsername)  { feedTitleName = feedTitleName.interpolate({username: options.username}); }
      if(options.currentFeed.performSearch)     { feedTitleName = feedTitleName.interpolate({query: options.query}); }
      if(options.currentFeed.filteredUsers)     { feedTitleName = feedTitleName.interpolate({groupName: options.groupName}); }
      return feedTitleName;
    };

    updateTweets = function() {
      $.ajax({
        type: "GET",
        url: buildURL(options.currentFeed),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }                                                   // set data to data from search results
          var originalSinceID = jitter.sinceID,                                                       // freeze sinceID to see if sinceID was set from a previous request
              updatingExistingTweets = !!jitter.sinceID;

          if(options.currentFeed.trackSince === true && data[0]) { jitter.sinceID = data[0].id; }     // set sinceID to the 'newest' tweet in the results
          if(options.onUpdate && typeof(options.onUpdate) == "function") { options.onUpdate(data); }  // trigger the onUpdate callback

          if(updatingExistingTweets) { data = data.reverse(); }                                       // reverse dataset for unshift

          $.each(data, function(index, item) {
            var modify = updatingExistingTweets ? jitter.tweets.unshift(item) : jitter.tweets.push(item);
          });
        }
      });
    };
    
    // point to internals
    self.tweets       = function() { return jitter.tweets; };
    self.updateTweets = function() { return updateTweets(); };
    self.options      = function() { return options; };
    
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
    
    self.start = function() {
      updateTweets();
      setupTimer();
    };
    
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
      simpleTitle: "Public Timeline",
      title: "Public Timeline"
    },
    friendsTimeline: {
      url: "http://{username}:{password}@twitter.com/statuses/friends_timeline.json",
      requiresUsername: true,
      requiresPassword: true,
      trackSince: true,
      name: "friends-{username}",
      simpleTitle: "Friend Timeline",
      title: "Friend Timeline for {username}"
    },
    groupTimeline: {
      url: "http://search.twitter.com/search.json",
      trackSince: true,
      filteredUsers: true,
      name: "group-{groupName}",
      simpleTitle: "Group Timeline",
      title: "{groupName} Timeline"
    },
    userTimeline: {
      url: "http://twitter.com/statuses/user_timeline/{username}.json",
      requiresUsername: true,
      trackSince: true,
      name: "user-{username}",
      simpleTitle: "User Timeline",
      title: "Timeline for {username}"
    },
    directMessages: {
      url: "http://{username}:{password}@twitter.com/direct_messages.json",
      trackSince: true,
      requiresUsername: true,
      requiresPassword: true,
      name: "direct-message-{username}",
      simpleTitle: "Direct Messages",
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
      simpleTitle: "Search Feed",
      title: "Search Results for '{query}'"
    }
  };
})(jQuery);
(function($) {
  $.jitter.builder = function(target, options) {
    var builder = {},
        self = {};
    options = options || {};
    
    var showTweets = function(tweetsParent, tweetClass, numberOfTweetsToDisplay) {
      tweetsParent.find(".tweet:visible").hide();
      tweetsParent.find(tweetClass + ":lt(" + numberOfTweetsToDisplay + "):not(.no-show)").show();
    };
    
    var showTweetCount = function(anchor) {
      var ct = $(anchor).data("unreadCount");
      return (ct > 20 ? ct : 20);
    };
    
    var handleTweets = function(tweets) {
      var currentlyFilteredToSelf = false, currentlyFilteredToAll = false;
      
      if(target.find(".jitter-filters a.active").length) {
        currentlyFilteredToSelf = target.find(".jitter-filters a.active").attr("id").indexOf(builder.cssClass()) >= 0;
      }
      
      currentlyFilteredToAll = target.find(".jitter-filters a.active").length ? (target.find(".jitter-filters a.active").attr("class").match("allTweets") ? true : false) : false;
      
      if(tweets.length) {
        var wrapper = $("<div/>");
        $.each(tweets, function(index, tweet) {
          $('\
            <div class="tweet clearfix">\
              <div class="meta span-5 prepend-1">\
                <div class="author">\
                  <div class="tweetImage span-2"/>\
                  <div class="displayName span-3 last"/>\
                </div>\
                <div class="createdAt"/>\
                <div class="backtrack"/>\
              </div>\
              <div class="tweetBody span-11 append-1 last"/>\
            </div>')
            .addClass(builder.cssClass())
            .addClass("author-" + $.twitter.username(tweet))
            .find(".tweetBody").html($.twitter.linkedText(tweet)).end()
            .find(".author .displayName").html($.twitter.userURL(tweet)).end()
            .find(".author .tweetImage").append($.twitter.image(tweet)).end()
            .find(".createdAt").html($.twitter.timestamp(tweet)).end()
            .appendTo(wrapper);
        });
        
        var tweetElements = $(wrapper.html()).hide();
        
        if(target.find(".tweet").length) {
          target.find(".tweets").prepend(tweetElements);
          if(currentlyFilteredToSelf || currentlyFilteredToAll) {
            tweetElements.fadeIn("slow");
          } else {
            var correspondingAnchor = $("a#" + builder.cssClass());
            var num = Number(correspondingAnchor.data("unreadCount")) + tweets.length;
            if(num) { correspondingAnchor.data("unreadCount", num); }
          }
        } else {
          target.find(".tweets").append(tweetElements);
        }
      }
      
      if(currentlyFilteredToSelf) {
        showTweets(target, "." + builder.cssClass(), showTweetCount("#" + builder.cssClass()));
      } else if(currentlyFilteredToAll) {
        showTweets(target, ".tweet", 40);
      }
    };
    
    // initialize
    (function() {
      options.onUpdate = function(tweets) { handleTweets(tweets); };
      builder.jitter = $.jitter(options);
      builder.cssClass = function() { return builder.jitter.feedClass(); };
      builder.feedTitle = function() { return builder.jitter.feedTitle(); };
      builder.showTweets = showTweets;
      builder.showTweetCount = showTweetCount;

      var filterBuilder = $.jitter.builder.filter(target, builder);
      filterBuilder.buildFilterLink();
      $.jitter.builder.forms(target, builder);
      builder.jitter.start();
    })();
    
    return self;
  };
  
  $.jitter.builder.filter = function(target, builder) {
    var self = {};
    
    var readFilterLink = function(anchor) {
      var $anchor = $(anchor);
      $anchor.data("unreadCount", 0);
    };
    
    var triggerFilterLink = function(anchor) {
      var $anchor = $(anchor);
      $anchor
        .siblings().removeClass("active").end()
        .addClass("active")
        .data("displayTweets", "." + $anchor.attr("id"));
      readFilterLink(anchor);
      builder.showTweets(target, $anchor.data("displayTweets"), builder.showTweetCount($anchor));
      $(document).scrollTo($(".tweet:visible:eq(0)"), 200);
    };
    
    self.buildFilterLink = function() {
      $("<a/>")
        .html(builder.feedTitle())
        .attr({href: "#", id: builder.cssClass()})
        .click(function() { triggerFilterLink(this); return false; })
        .observeData()
        .bind("unreadCountChanged", function(e, data) {
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
        })
        .data("unreadCount", 0)
        .appendTo(target.find(".jitter-filters"));
    };
    
    if(!target.find(".jitter-filters").length) {
      var filters = $("<div class='jitter-filters span-6'/>").html("<h1>Jitter!</h1>");
      
      $("<a/>")
        .html("All Feeds")
        .attr({href: "#", id: "tweet"})
        .addClass("active allTweets")
        .click(function () { triggerFilterLink(this); return false; })
        .appendTo(filters);
      target.prepend(filters);
    }
    
    return self;
  };
  
  $.jitter.builder.forms = function(target, builder) {
    if(target.find(".forms").length) { return; }
    
    var wrapper = $("<div class='forms'/>");
    
    var buildFeedForm = function(feed) {
      var form = $("<form/>")
        .attr({action: "#"})
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
          target.jitter(options);
          $this.find("input:not([type=submit])").val("");
          return false;
        });
      
      if(feed.requiresUsername) {
        $("<label for='username'>Username</label><input type='text' name='username' />").appendTo(form);
      }
      
      if(feed.requiresPassword) {
        $("<label for='password'>Password</label><input type='password' name='password' />").appendTo(form);
      }
      
      if(feed.performSearch) {
        $("<label for='query'>Search</label><input type='text' name='query' />").appendTo(form);
      }
      
      if(feed.filteredUsers) {
        $("<label for='groupName'>Group Name</label><input type='text' name='groupName' />").appendTo(form);
        $("<label for='users'>Users</label><input type='text' name='users' />").appendTo(form);
      }
      
      $("<input type='submit' value='Add Feed' />").appendTo(form);
      
      $("<div/>")
        .append($("<h2/>").html(feed.simpleTitle))
        .append(form)
        .appendTo(wrapper);
    };
    
    $.each($.jitter.feeds, function(index, item) {
      if(item.simpleTitle) {
        buildFeedForm(item);
      }
    });
    
    target.append(wrapper);
  };
})(jQuery);(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".tweets").length) {
      target.append($("<div class='tweets prepend-6 span-18 last'/>"));
    }
    
    var builder = $.jitter.builder(target, options);
    
    (function() {
      $(".tweet").live("click", function(e) {
        $(this).siblings().removeClass("current");
        $(this).addClass("read").addClass("current");
      });
      
      var currentFilteredClass = function() {
        var potentialFilterClass = target.find(".jitter-filters a.active").attr("id");
        if(potentialFilterClass) {
          return "." + potentialFilterClass;
        }
        return "";
      };
      
      var triggerTweet = function(t) {
        t.trigger("click");
        $(document).scrollTo($(".tweet.current"), 200);
      };

      var hideVisibleTweets = function() { $(".tweet.read" + currentFilteredClass()).addClass("no-show"); $(".tweet.no-show:visible").hide(); };
      var showHiddenTweets = function() { $(".tweet.no-show" + currentFilteredClass()).show().removeClass("no-show"); };
      var openTweetAuthorTwitterPage = function() { window.open($(".tweet.current .author .displayName a").attr("href"), "_blank"); };
      var openTweetLinkedURLs = function() { 
        $(".tweet.current .tweetBody a").each(function(idx, anchor) {
          window.open($(anchor).attr("href"), "_blank");
        });
      };
      var setCurrentToFirstTweet = function() { triggerTweet($(".tweet:visible:first")); };
      var setCurrentToNextTweet = function() { triggerTweet($(".tweet.current").next(":visible")); };
      var setCurrentToPrevTweet = function() { triggerTweet($(".tweet.current").prev(":visible")); };
      var setCurrentToLastTweet = function() { triggerTweet($(".tweet:visible:last")); };

      if(!$(document).data("keypressAssigned")) {
        $(document).keydown(function(e) {
          if (/(input|textarea|select)/i.test(e.target.nodeName)) { return; } 
          
          var currentTweet = $(".tweet.current:visible").length;
          var keyPressed = String.fromCharCode(e.which);
          
          if(keyPressed == "H") {
            hideVisibleTweets();
          } else if(keyPressed == "U") {
            showHiddenTweets();
          } else if(keyPressed == "O") {
            openTweetAuthorTwitterPage();
          } else if(keyPressed == "P") {
            openTweetLinkedURLs();
          } else if(keyPressed == "J") {
            setCurrentToFirstTweet();
          } else if(keyPressed == "I") {
            setCurrentToPrevTweet();
          } else if(keyPressed == "L") {
            setCurrentToLastTweet();
          } else if(keyPressed == "K") {
            setCurrentToNextTweet();
          }
          var number = new Number(keyPressed);
          if(number) {
            var anch = $(".jitter-filters a:eq(" + number + ")");
            if(anch) { anch.trigger("click"); }
          }
        });
        $(document).data("keypressAssigned", true);
      }
    })();
    
    return target;
  };
})(jQuery);