(function($) {
  $.jitter.bindings = function() {
    // tweet read handler;
    $(document).bind("jitter-tweet-read", function(event, info) {
      $.benchmark("marking tweets read/current", function() {
        var currentSiblings = info.tweets.siblings();
        if(currentSiblings.length) {
          currentSiblings.removeClass('current');
        }
        info.tweets.addClass("read");
      
        if(info.markAsCurrent)    { info.tweets.addClass("current"); }
        if(info.scrollToCurrent)  { $.jitter.window.tweets.current.scrollTo(); }
      });
    });
    
    $(document).bind("jitter-tweet-delete", function(event, info) {
      $.benchmark("deleting tweet(s)", function() {
        info.tweets.remove();
      });
    });
    
    // building tweet HTML / appending to document
    $(document).bind("jitter-success", function(event, info) {
      $.benchmark("building HTML from tweets returned", function() {
        var tweets = info.data,
            $target = $.jitter.window.container();
        
        if(!$target || tweets.length == 0) { return; }
        
        if(tweets.length) {
          var $wrapper = $("<div/>");
          $.each(tweets, function(index, tweet) {
            $.jitter.window.build.tweet(tweet, info.jitter).appendTo($wrapper);
          });
          
          var $tweetElements = $wrapper.children().hide()[$("div.tweet").filter("." + info.jitter.feed.className).length ? "prependTo" : "appendTo"]($target.find("#tweets"));
          
          if($.jitter.window.currentlyFilteredToFeed(info.jitter.feed) || $.jitter.window.currentlyFilteredToAll()) {
            $tweetElements.fadeIn("slow", function() { $.jitter.window.tweets.current.scrollTo(); });
          }
        }
      });
    });

    // refresh timestamps and update unread counts
    $(document).bind("jitter-success", function(event, info) {
      if(!info.data.length > 0) { return; }
      $.benchmark("setting unread counts data within $(document)", function() {
        $(document).data("jitter-unread", ($(document).data("jitter-unread") || 0) + info.data.length);
        $(document).data("jitter-unread-" + info.jitter.feed.className, ($(document).data("jitter-unread-" + info.jitter.feed.className) || 0) + info.data.length);
      });
    });

    // tweet read/unread count
    $(document).bind("jitter-tweet-read", function(event, info) {
      $.benchmark("marking tweet(s) as read", function() {
        var $unreadTweets = info.tweets.filter(":not(.tweet-read)");
        
        if($unreadTweets.filter($.jitter.window.currentlyFilteredClass()).length === $unreadTweets.length && $.jitter.window.currentFeed()) {
          var unreadCountHandle = "jitter-unread-" + $.jitter.window.currentFeed().className,
              unreadCount = $(document).data(unreadCountHandle);
          $(document).data(unreadCountHandle, unreadCount - $unreadTweets.length);
        } else {
          $unreadTweets.each(function(itx, tweet) {
            var unreadCountHandle = "jitter-unread-" + $(tweet).data("jitter").feed.className,
                unreadCount = $(document).data(unreadCountHandle);
            $(document).data(unreadCountHandle, unreadCount - 1);
          });
        }
        
        $(document).data("jitter-unread", $(document).data("jitter-unread") - $unreadTweets.length);
        $unreadTweets.addClass("tweet-read");
      });
    });

    // create filter link when jitter starts
    $(document).bind("jitter-started", function(event, info) {
      $.benchmark("building jitter filter link", function() {
        $.jitter.window.build.filter(info.jitter).appendTo($(".jitter-filters"));
      });
    });

    $(document).bind("jitter-change", function(event, info) {
      $.benchmark("toggling filters within the view", function() {
        if(info.jitter.feed.className) {
          $("div.tweet").hide();
          $("div.tweet").filter("." + info.jitter.feed.className).show();
        } else {
          $("div.tweet:hidden").show();
        }
      });
    });

    $(document).bind("setData", function(e, key, val) {
      if(/^jitter-unread$/.test(key)) {
        $.benchmark("changing unread count based on data change", function() {
          var $title = $("head title"),
              strippedTitle = $title.html().replace(/\s+\(.+\)/, '');
          $title.html(strippedTitle + " (" + val + ")");
          
          if(window.document.title) { window.document.title = $title.html(); }
          if(window.fluid)          { window.fluid.dockBadge = val ? val : null; }
        });
      } else if(/^jitter-unread\-(.+)$/.test(key)) {
        $.benchmark("specific jitter feed data changed", function() {
          var matches = key.match(/^jitter-unread\-(.+)$/);
          if(matches){
            var className = matches[1];
            if($(".jitter-filter." + className)) {
              $(".jitter-filter." + className).data("unreadCount", val);
            }
          }
        });
      }
    });

    $(document).bind("setData", function(e, key, val) {
      if(/^jitter-current$/.test(key)) {
        $(document).trigger("jitter-change", {jitter: val});
      }
    });

    $(document).ready(function() {
      $.timer(60 * 1000, function(t) {
        $.jitter.window.refreshTimestamps(); 
      });
    });
  };
})(jQuery);
