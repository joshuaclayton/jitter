(function($) {
  var triggerTweet = function(tweets, options) {
    var opts = $.extend({}, {tweets:tweets, markAsCurrent: true, scrollToCurrent: true}, options);
    $(document).trigger("jitter-tweet-read", opts);
  };
  
  $.jitter.window = {
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
          .addClass(feed.className).addClass("author-" + $.twitter.username(tweet))
          .data("jitter", jitter)
          .click(function() {
            $(document).trigger("jitter-tweet-read", {tweets: $(this), markAsCurrent: true, scrollToCurrent: true});
            return false;
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
            <a class="twitter-rss">RSS</a>\
            <a class="show-filter"></a>\
            <a class="delete-filter">Delete Feed</a>\
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
        if(!$.jitter.window.container) { return; }
        $.jitter.window.container().append("<div class='jitter-filters span-6'/><div class='tweets span-18 prepend-6'/>");
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
      markAsRead: function(options) {
        var $selector;

        $.benchmark(function() {
          $selector = $("div.tweet");
        });
        
        $.benchmark(function() {
          var opts = $.extend({}, {visible: true}, options);
          
          if(opts.visible) { $selector = $selector.siblings(":visible"); }
          if(opts.feed) {
            if(typeof(opts.feed) == "function") { opts.feed = opts.feed(); }
            if(typeof(opts.feed) == "string") {
              $selector = $selector.siblings(opts.feed);
            } else if(opts.feed.className) {
              $selector = $selector.siblings("." + opts.feed.className);
            }
          }
        });
        
        $.benchmark(function() {
          triggerTweet($selector, {markAsCurrent: false, scrollToCurrent: false});
        });
      },
      current: {
        scrollTo:       function() { $(document).scrollTo($("div.tweet.current"), 200); },
        setToFirst:     function() { triggerTweet($("div.tweet:visible:first")); },
        setToNext:      function() { triggerTweet($("div.tweet.current").nextAll(":visible:first")); },
        setToPrevious:  function() { triggerTweet($("div.tweet.current").prevAll(":visible:first")); },
        setToLast:      function() { triggerTweet($("div.tweet:visible:last")); },
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