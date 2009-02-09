(function($) {
  var triggerTweet = function(tweets, options) {
    var opts = $.extend({}, {tweets:tweets, markAsCurrent: true, scrollToCurrent: true}, options);
    $.benchmark("trigger selected tweets", function() {
      $(document).trigger("jitter-tweet-read", opts);
    });
  };
  
  var deleteTweet = function(tweets, options) {
    var opts = $.extend({}, {tweets:tweets}, options);
    $.benchmark("delete selected tweets", function() {
      $(document).trigger("jitter-tweet-delete", opts);
    });
  };
  
  $.jitter.window = {
    loggable: function() { return window.console && window.console.log; },
    container: function() { return $("#content"); },
    currentJitter: function() {
      if(arguments.length) {
        return $(document).data("jitter-current", arguments[0]);
      } else {
        return $(document).data("jitter-current");
      }
    },
    currentFeed: function() {
      if($.jitter.window.currentJitter()) { return $.jitter.window.currentJitter().feed; }
    },
    currentlyFilteredToFeed: function(feed) {
      return $.jitter.window.currentFeed() === feed;
    },
    currentlyFilteredToAll: function() {
      return $.jitter.window.currentFeed() === null;
    },
    currentlyFilteredClass: function() {
      if($.jitter.window.currentFeed()) { return "." + $.jitter.window.currentFeed().className; }
      return "";
    },
    refreshTimestamps: function() {
      $("div.timestamp:visible").each(function(idx, item) {
        $(item).html($.prettyDate($(item).attr("title")));
      });
    },
    build: {
      tweet: function(tweet, jitter) {
        var feed = jitter.feed;
        return $('\
          <div class="tweet clearfix">\
            <div class="meta span-5">\
              <div class="author">\
                <div class="tweetImage span-2"/>\
                <div class="displayName span-3 last"/>\
              </div>\
              <div class="createdAt timestamp"/>\
              <div class="backtrack"/>\
            </div>\
            <div class="tweetBody span-11 last"/>\
          </div>')
          .addClass(feed.className).addClass("author-" + $.twitter.username(tweet)).attr("id", $.twitter.domID(tweet))
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
          .find(".twitter-rss")
            .attr({href: feed.url({format: "rss"}), target: "_blank"}).end()
          .find(".show-filter")
            .html(feed.title)
            .attr({href: "#"})
            .click(function() {
              $.jitter.window.currentJitter(jitter);
              return false;
            }).end();
      },
      initialPage: function() {
        if(!$.jitter.window.container()) { return; }
        $.jitter.window.container().append("\
          <div class='span-8 sidebar'>\
            <div class='header span-8 last'>\
              <h1>Jitter</h1>\
            </div>\
            <div class='jitter-filters span-8 last'/>\
          </div>\
          <div id='tweets' class='span-16 prepend-8'/>\
          <div id='tweets-archive' class='span-16 prepend-8'/>\
        ");
      },
      keyboardCheatSheet: function() {
        var $wrapper = $("<div class='cheatsheet'><dl></dl></div>");
        $.each($.jitter.keyboard.mappings, function(key, val) {
          var $dt = $("<dt/>").html(val.key || key),
              $dd = $("<dd/>").html(val.description);
          $wrapper.find("dl").append($dt).append($dd);
        });
        return $wrapper;
      }
    },
    tweets: {
      read: function(options) {
        // TODO: CLEAN UP
        var $allTweets = $('#tweets div.tweet'),
          allTweetsLength = $allTweets.length,
          filteredTweets = [],
          tweetFilter = null,
          $selector,
          opts = $.extend({}, {visible: true}, options);
        
        $.benchmark("calculating selector", function() {
          if(opts.feed) {
            if(typeof(opts.feed) === "function") { opts.feed = opts.feed(); }
            if(typeof(opts.feed) === "string") {
              tweetFilter = opts.feed.slice(1);
            } else if(opts.feed.className) {
              tweetFilter = opts.feed.className;
            }
          }
        
          if (opts.visible) {
            for (var i=0; i < allTweetsLength; i++) {
              if ( (tweetFilter === null || $allTweets[i].className.indexOf(tweetFilter) !== -1) 
              && $allTweets[i].style.display !== 'none') {
                filteredTweets.push($allTweets[i]);
              }
            }
          } else {
            if (filteredTweets === null) {
              filteredTweets = $allTweets.get();
            }
            for (var i=0; i < allTweetsLength; i++) {
              if ($allTweets[i].className.indexOf(tweetFilter) !== -1) {
                filteredTweets.push($allTweets[i]);
              }
            }
          } 
          $selector = $(filteredTweets);
        });
        
        triggerTweet($selector, {markAsCurrent: false, scrollToCurrent: false});
      },
      archive: function(options) {
        var selector = "#tweets div.tweet",
            opts = $.extend({}, {visible: true}, options);
        
        if(opts.feed) {
          if(typeof(opts.feed) === "function") { opts.feed = opts.feed(); }
          if(typeof(opts.feed) === "string") {
            selector += opts.feed;
          } else if(opts.feed.className) {
            selector += "." + opts.feed.className;
          }
        }
        
        if(opts.visible) { selector += ":visible"; }
        $(document).trigger("jitter-tweet-archive", {tweets: $(selector)});
      },
      current: {
        scrollTo:       function() { $(document).scrollTo($("#tweets div.tweet.current"), 200); },
        setToFirst:     function() { triggerTweet($("#tweets div.tweet:visible:first")); },
        setToNext:      function() { triggerTweet($("#tweets div.tweet.current").nextAll(":visible:first")); },
        setToPrevious:  function() { triggerTweet($("#tweets div.tweet.current").prevAll(":visible:first")); },
        setToLast:      function() { triggerTweet($("#tweets div.tweet:visible:last")); },
        destroy:        function() { 
          var $ele = null;
          if(arguments[0]) { $ele = arguments[0].moveTo(); }
          deleteTweet($("div.tweet.current"));
          if($ele) { triggerTweet($ele); }
        },
        openLinks: function() { 
          $("div.tweet.current div.tweetBody a").each(function(idx, anchor) {
            window.open($(anchor).attr("href"), "_blank");
          });
        },
        openAuthorTwitterLink: function() { window.open($("div.tweet.current div.author div.displayName a").attr("href"), "_blank"); }
      }
    }
  };
})(jQuery);