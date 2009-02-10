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
    loggable: function() { return window.console && window.console.log; },
    container: function() { return $("#content"); },
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
