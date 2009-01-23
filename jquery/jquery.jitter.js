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

String.prototype.strip = function() {
  var result = this;
  result = result.replace(/^ +| +$/g, '');
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
    
    var $inputs = $("<div></div>").append(this).find("input");
    var $textareas = $("<div></div>").append(this).find("textarea");
    
    $.each($inputs, handleItem);
    $.each($textareas, handleItem);
    
    return this;
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
})(jQuery);(function($) {
  $.jitter = function(settings) {
    var options = $.extend({}, $.jitter.defaults, settings),
        updateTweets = function() {},
        jitter = {tweets: []};
    options.currentFeed = typeof(options.feed) === "string" ? $.jitter.feeds[options.feed] : options.feed;
    
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

          if(!!options.currentFeed.trackSince && data[0]) { jitter.sinceID = data[0].id; }            // set sinceID to the 'newest' tweet in the results
          if(options.onUpdate && typeof(options.onUpdate) == "function") { options.onUpdate(data); }  // trigger the onUpdate callback

          if(updatingExistingTweets) { data = data.reverse(); }                                       // reverse dataset for unshift

          $.each(data, function(index, item) {
            var modify = updatingExistingTweets ? jitter.tweets.unshift(item) : jitter.tweets.push(item);
          });
        }
      });
    };

    try {
      if(options.currentFeed == $.jitter.feeds.search && !options.query) { throw($.jitter.errors.invalidSearchRequest); }
      if(options.currentFeed == $.jitter.feeds.groupTimeline && (!options.users || (options.users && !options.users.length) || !options.groupName)) { throw($.jitter.errors.invalidGroupTimelineRequest); }
      if(options.currentFeed == $.jitter.feeds.userTimeline && !options.username) { throw($.jitter.errors.invalidUserTimelineRequest); }
    } catch(error) {
      handleError(error);
      return;
    }

    return {
      feedClass: feedClass,
      feedTitle: feedTitle,
      tweets: function() { return jitter.tweets; },
      updateTweets: function() { return updateTweets(); },
      options: function() { return options; },
      start: function() {
        updateTweets();
        if(!jitter.timer) {
          jitter.timer = $.timer(calculateRefreshRate(), function(t) { updateTweets(); });
          this.stop = function() { jitter.timer.stop(); };
          this.restart = function() { jitter.timer.reset(calculateRefreshRate()); };
        }
      }
    };
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
      
      $("div.timestamp").each(function(idx, item) {
        $(item).html($.prettyDate($(item).title));
      });
      
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
                <div class="createdAt timestamp"/>\
                <div class="backtrack"/>\
              </div>\
              <div class="tweetBody span-11 append-1 last"/>\
            </div>')
            .addClass(builder.cssClass())
            .addClass("author-" + $.twitter.username(tweet))
            .find(".tweetBody").html($.twitter.linkedText(tweet)).end()
            .find(".author .displayName").html($.twitter.userURL(tweet)).end()
            .find(".author .tweetImage").append($.twitter.image(tweet)).end()
            .find(".createdAt")
              .html($.twitter.prettyTimestamp(tweet))
              .attr("title", $.twitter.timestamp(tweet))
              .end()
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
      $.jitter.builder.cheatsheet(target);
      builder.jitter.start();
    })();
    
    return self;
  };
  
  $.jitter.builder.filter = function(target, builder) {
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
    
    (function() {
      if(!target.find(".jitter-filters").length) {
        var filters = $("<div class='jitter-filters span-6'/>").html("<h1>Jitter</h1>");

        $("<a/>")
          .html("All Feeds")
          .attr({href: "#", id: "tweet"})
          .addClass("active allTweets")
          .click(function () { triggerFilterLink(this); return false; })
          .appendTo(filters);
        target.prepend(filters);
      }
    })();
    
    return {
      buildFilterLink: function() {
        $("<a/>")
          .html(builder.feedTitle())
          .attr({href: "#", id: builder.cssClass()})
          .click(function() { triggerFilterLink(this); return false; })
          .dblclick(function() { 
            target.find("." + builder.cssClass()).remove();
            $(this).remove(); 
            builder.jitter.stop();
            target.find(".jitter-filters a:first").trigger("click");
          })
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
      }
    };
  };
  
  $.jitter.builder.forms = function(target, builder) {
    if(target.find(".forms").length) { return; }
    
    var wrapper = $("<div class='forms'/>");
    
    var buildFeedForm = function(feed, idx) {
      var form = $("<form class='prepend-1 append-1 span-10'></form>")
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
        }),
        fieldset = $("<fieldset/>").append($("<legend/>").html("<span>" + feed.simpleTitle + "</span>"));

      if(feed.requiresUsername) {
        $("<label for='username'>Username</label><input type='text' name='username' class='title span-8' value='Enter a Username' />").defaultValueActsAsHint().appendTo(fieldset);
      }
      
      if(feed.requiresPassword) {
        $("<label for='password'>Password</label><input type='password' name='password' class='title span-8' value='Password'/>").defaultValueActsAsHint().appendTo(fieldset);
      }
      
      if(feed.performSearch) {
        $("<label for='query'>Search</label><input type='text' name='query' class='title span-8' value='Enter a Search Term' />").defaultValueActsAsHint().appendTo(fieldset);
      }
      
      if(feed.filteredUsers) {
        $("<label for='groupName'>Group Name</label><input type='text' name='groupName' class='title span-8' value='Name of Your Group' />").defaultValueActsAsHint().appendTo(fieldset);
        $("<label for='users'>Users</label><input type='text' name='users' class='title span-8' value='Comma-delimited List of Users' />").defaultValueActsAsHint().appendTo(fieldset);
      }
      
      $("<input type='submit' value='Add Feed' />").appendTo(fieldset);
      
      var evn = !!(idx % 2 == 0);
      $("<div class='jitterForm span-12'/>")
        .addClass(evn ? "last" : "")
        .append(form.append(fieldset))
        .appendTo(wrapper);
      if(evn) {
        wrapper.append("<hr class='space' />");
      }
    };
    
    var index = 0;
    
    $.each($.jitter.feeds, function(feedName, item) {
      if(item.simpleTitle) { index++; buildFeedForm(item, index); }
    });
    
    target.append(wrapper);
  };
  
  $.jitter.builder.cheatsheet = function(target) {
    if(target.find('.cheatsheet').length) { return; }
    
    $("\
      <div class='cheatsheet'>\
        <h3>Keyboard Shortcuts</h3>\
        <dl>\
          <dt>I</dt>\
          <dd>Navigate to previous tweet</dd>\
          <dt>K</dt>\
          <dd>Navigate to next tweet</dd>\
          <dt>J</dt>\
          <dd>Navigate to first tweet</dd>\
          <dt>L</dt>\
          <dd>Navigate to last tweet</dd>\
          <dt>H</dt>\
          <dd>Hide read tweets</dd>\
          <dt>U</dt>\
          <dd>Show hidden read tweets</dd>\
          <dt>O</dt>\
          <dd>Open user's Twitter page (in new window)</dd>\
          <dt>P</dt>\
          <dd>Open all links within tweet body (including @replies) (in new window)</dd>\
        </dl>\
      </div>\
    ").appendTo(target);
  };
})(jQuery);(function($) {
  $.fn.jitter = function(options) {
    var target = this;
    
    if(!target.find(".tweets").length) { target.append($("<div class='tweets prepend-6 span-18 last'/>")); }
    
    $.jitter.builder(target, options);
    
    (function() {
      if($(document).data("keypressesBound")) { return; }
      
      var currentFilteredClass = function() {
        var potentialFilterClass = target.find(".jitter-filters a.active").attr("id");
        if(potentialFilterClass) { return "." + potentialFilterClass; }
        return "";
      };
      
      var triggerTweet = function(t) { t.trigger("click"); };
      var hideVisibleTweets = function() { $("div.tweet.read" + currentFilteredClass()).addClass("no-show"); $("div.tweet.no-show:visible").hide(); };
      var showHiddenTweets = function() { $("div.tweet.no-show" + currentFilteredClass()).show().removeClass("no-show"); };
      var openTweetAuthorTwitterPage = function() { window.open($("div.tweet.current div.author div.displayName a").attr("href"), "_blank"); };
      var openTweetLinkedURLs = function() { 
        $("div.tweet.current div.tweetBody a").each(function(idx, anchor) {
          window.open($(anchor).attr("href"), "_blank");
        });
      };
      var setCurrentToFirstTweet = function() { triggerTweet($("div.tweet:visible:first")); };
      var setCurrentToNextTweet = function() { triggerTweet($("div.tweet.current").nextAll(":visible:first")); };
      var setCurrentToPrevTweet = function() { triggerTweet($("div.tweet.current").prevAll(":visible:first")); };
      var setCurrentToLastTweet = function() { triggerTweet($("div.tweet:visible:last")); };
      
      $("div.tweet").live("click", function(e) {
        $(this)
          .siblings(".current").removeClass("current").end()
          .addClass("read current");
        $(document).scrollTo($("div.tweet.current"), 175);
      });
      
      $(document).keydown(function(e) {
        if (/(input|textarea|select)/i.test(e.target.nodeName)) { return; }

        var keyPressed = String.fromCharCode(e.which);
        
        var keyMappings = {
          "H": hideVisibleTweets,
          "U": showHiddenTweets,
          "O": openTweetAuthorTwitterPage,
          "P": openTweetLinkedURLs,
          "J": setCurrentToFirstTweet,
          "37": setCurrentToFirstTweet,
          "I": setCurrentToPrevTweet,
          "38": setCurrentToPrevTweet,
          "L": setCurrentToLastTweet,
          "39": setCurrentToLastTweet,
          "K": setCurrentToNextTweet,
          "40": setCurrentToNextTweet
        };
        
        if(keyMappings[keyPressed] || keyMappings[e.which]) {
          e.preventDefault();
          keyMappings[keyPressed] ? keyMappings[keyPressed]() : keyMappings[e.which]();
        }
        
        var number = new Number(keyPressed);
        if(number && number >= 0) {
          var anch = $(".jitter-filters a:eq(" + number + ")");
          if(anch) { e.preventDefault(); anch.trigger("click"); }
        }
      });
      $(document).data("keypressesBound", true);
    })();
    
    return target;
  };
})(jQuery);