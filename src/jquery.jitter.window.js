(function($) {
  var triggerTweet = function(t, options) {
    $.log("tweets triggered: " + t.length);
    var opts = $.extend({}, {tweets:t, markAsCurrent: true, scrollToCurrent: true}, options);
    $(document).trigger("jitter-tweet-read", opts);
  };
  
  $.jitter.window = {
    currentlyFilteredToFeed: function(feed) {
      return $(document).data("jitter-filter-current") === feed;
    },
    currentlyFilteredToAll: function() {
      return !$(document).data("jitter-filter-current");
    },
    refreshTimestamps: function() {
      $("div.timestamp").each(function(idx, item) {
        $(item).html($.prettyDate($(item).attr("title")));
      });
    },
    buildTweetHTML: function(tweet, jitter) {
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
        .addClass(feed.className)
        .addClass("author-" + $.twitter.username(tweet))
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
    buildFilterHTML: function(jitter) {
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
              $("<span class='unreadCount'/>").
                html(val).
                appendTo($this);
            } else {
              $this.
                find(".unreadCount").
                html(val);
            }
            if(val === 0) { $this.find(".unreadCount").remove(); }
          }
        })
        .find(".twitter-rss")
          .attr("href", feed.url({format: "rss"})).end()
        .find(".show-filter")
          .html(feed.title)
          .click(function() {
            $(this)
              .trigger("jitter-filter-change", {jitter: jitter})
              .parent()
                .siblings().removeClass("active").end()
                .addClass("active");
            return false;
          });
    },
    findFilterLink: function(feed) {
      return $(".jitter-filter." + feed.className);
    },
    currentFilteredClass: function() {
      var currFeed = $(document).data("jitter-filter-current");
      if(currFeed) { return "." + currFeed.className; }
      return "";
    },
    markAsRead: function(options) {
      var opts = $.extend({}, {visible: true}, options);
      
      var $selector = $("div.tweet");
      if(opts.visible) { $selector = $selector.siblings(":visible").andSelf(); }
      if(opts.feed) { 
        if(typeof(opts.feed) == "string") {
          $selector = $selector.siblings(opts.feed).andSelf();
        } else if(opts.feed.className) {
          $selector = $selector.siblings("." + opts.feed.className).andSelf();
        }
      }
      
      triggerTweet($selector, {markAsCurrent: false, scrollToCurrent: false});
    },
    currentTweet: {
      setToFirst: function() { triggerTweet($("div.tweet:visible:first")); },
      setToNext:  function() { triggerTweet($("div.tweet.current").nextAll(":visible:first")); },
      setToPrevious:  function() { triggerTweet($("div.tweet.current").prevAll(":visible:first")); },
      setToLast:  function() { triggerTweet($("div.tweet:visible:last")); },
      openLinks: function() { 
        $("div.tweet.current div.tweetBody a").each(function(idx, anchor) {
          window.open($(anchor).attr("href"), "_blank");
        });
      },
      openAuthorTwitterLink: function() { window.open($("div.tweet.current div.author div.displayName a").attr("href"), "_blank"); }
    }
  };
})(jQuery);