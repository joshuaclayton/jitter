// tweet read handler
$(document).bind("jitter-tweet-read", function(event, info) {
  var tweetElements = info.tweets;
  
  tweetElements
    .siblings(".current").removeClass("current").end()
    .addClass("read");
    
  if(info.markAsCurrent) { tweetElements.addClass("current"); }
  if(info.scrollToCurrent) { $(document).scrollTo($("div.tweet.current"), 175); }
});

// tweet read/unread count
$(document).bind("jitter-tweet-read", function(event, info) {
  if(!$(document).data("jitter-trackUnreadCounts") || info.previouslyRead) { return; }
  
  var tweets = info.tweets;
  
  var handleTweet = function(tweet) {
    var $tweet = $(tweet);
    var unreadCountHandle = "jitter-unread-" + $tweet.data("jitter").feed.className,
        unreadCount = $(document).data(unreadCountHandle);
        
    $(document).data("jitter-unread", $(document).data("jitter-unread") - 1);
    $(document).data(unreadCountHandle, unreadCount - 1);
  };
  
  if(tweets.length == 1) {
    handleTweet(tweets);
  } else {
    $.each(tweets, function(index, tweet) { handleTweet(tweet); });
  }
});

// building tweet HTML / appending to document
$(document).bind("jitter-success", function(event, info) {
  var tweets = info.data,
      $target = $(document).data("jitter-element-tweets");
  
  if(!$target) { return; }
  
  if(tweets.length) {
    var $wrapper = $("<div/>");
    $.each(tweets, function(index, tweet) {
      $.jitter.window.buildTweetHTML(tweet, info.jitter).appendTo($wrapper);
    });
    
    var $tweetElements = $wrapper.children().hide();
    
    $target.find(".tweets")[$target.find(".tweet").length ? "prepend" : "append"]($tweetElements);
    
    if($.jitter.window.currentlyFilteredToFeed(info.jitter.feed) || $.jitter.window.currentlyFilteredToAll()) {
      $tweetElements.fadeIn("slow");
    }
  }
});

// refresh timestamps
$(document).bind("jitter-success", function(event, info) {
  $.jitter.window.refreshTimestamps();
  $(document).data("jitter-unread", ($(document).data("jitter-unread") || 0) + info.data.length);
  $(document).data("jitter-unread-" + info.jitter.feed.className, ($(document).data("jitter-unread-" + info.jitter.feed.className) || 0) + info.data.length);
});

$(document).bind("jitter.filter.change", function(event, info) {
  $(document).data("jitter.filter.current", info.jitter);
});

$(document).bind("setData", function(e, key, val) {
  if(/jitter-unread/.test(key)) {
    
    var $title = $("head title"),
        strippedTitle = $title.html().replace(/\s+\(.+\)/, '');
    $title.html(strippedTitle + " (" + val + ")");
    if(window.document.title) {
      window.document.title = $title.html();
    }
    
    $("head title").data("unreadCount", $(document).data("jitter-unread"));
    var matches = key.match(/^jitter-unread\-(.+)$/);
    if(matches){
      var className = matches[1];
      if($(".jitter-filter." + className)) {
        $(".jitter-filter." + className).data("unreadCount", val);
      }
    }
    
    if(window.fluid) {
      window.fluid.dockBadge = $(document).data("jitter-unread");
    }
  }
});

$(document).ready(function() {
  $(document).data("jitter-element-tweets", $("#content"));
  $(document).data("jitter-trackUnreadCounts", true);
  var j1 = $.jitter();
  $(document).data("jitter-filter-current", j1.feed);
  j1.start();
  $.jitter.keyboard();
});
