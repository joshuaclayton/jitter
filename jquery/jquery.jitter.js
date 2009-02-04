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
          urlMatches = text.match(/https?\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!]/g);
      if(urlMatches) {
        $.each(urlMatches, function(idx, item) {
          text = text.replace(RegExp(item, "g"), $("<a/>").attr({href: item, target: "_blank"}).html(item).outerHTML());
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
    
    var calculateRefreshRate = function() {
      return 1000 * options.refreshRate;
    };
    
    (function() {
      if(self.guid) { return; }
      self.guid = "guid";
    })();
    
    var triggerData = function(data) {
      return {data: data, jitter: self};
    };
    
    var updateTweets = function() {
      $.ajax({
        type: "GET",
        url: self.feed.url({jitter: self}),
        dataType: "jsonp",
        success: function(data) {
          if(data.results) { data = data.results; }
          if(!!self.feed.trackSince && data[0]) { self.sinceID = data[0].id; }
          $(document).trigger("jitter-success", triggerData(data));
        }
      });
    };
    
    self.start = function() {
      $(document).trigger("jitter-started", {jitter: self});
      
      updateTweets();
      if(!self.timer) {
        self.timer = $.timer(calculateRefreshRate(), function(t) { updateTweets(); });
        this.stop = function() { self.timer.stop(); };
      }
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
(function($) {
  $.jitter.builder = function(target, options) {
    var builder = {},
        self = {};
    options = options || {};
    
    var showTweets = function(tweetsParent, tweetClass, numberOfTweetsToDisplay) {
      tweetsParent
        .find(".tweet").hide().end()
        .find(tweetClass + ":lt(" + numberOfTweetsToDisplay + "):not(.no-show)").show();
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
        $(item).html($.prettyDate($(item).attr("title")));
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
          $this.find("input").blur();
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

  };
})(jQuery);