(function($) {
  $.jitter.builder = function(target, options) {
    var builder = {},
        self = {};
    options = options || {};
    
    var showTweetCount = function(anchor) {
      var ct = $(anchor).data("unreadCount");
      return (ct > 20 ? ct : 20);
    };
    
    var showTweets = function(tweetsParent, tweetClass, numberOfTweetsToDisplay) {
      tweetsParent.find(".tweet").hide();
      tweetsParent.find(tweetClass + ":lt(" + numberOfTweetsToDisplay + ")").show();
    };
    
    var readFilterLink = function(anchor) {
      var $anchor = $(anchor);
      $anchor.data("unreadCount", 0);
    };
    
    var triggerFilterLink = function(anchor) {
      var $anchor = $(anchor);
      $anchor.parent().children().removeClass("active");
      $anchor
        .addClass("active")
        .attr("displayTweets", "." + $anchor.attr("id"));
      readFilterLink(anchor);
      
      showTweets(target, "." + $anchor.attr("id"), showTweetCount($anchor));
    };
    
    var handleTweets = function(tweets) {
      var currentlyFilteredToSelf = target.find(".jitter-filters a.active").attr("id").indexOf(builder.cssClass) >= 0;
      var currentlyFilteredToAll = target.find(".jitter-filters a.active").length ? (target.find(".jitter-filters a.active").attr("class").match("allTweets") ? true : false) : false;
      
      if(tweets.length) {
        var wrapper = $("<div/>");
        
        $.each(tweets, function(index, tweet) {
          var tweetWrapper = 
            $("<div class='tweet clearfix'/>")
              .addClass(builder.cssClass)
              .addClass("author-" + (tweet.user ? tweet.user.screen_name : tweet.from_user));
          var tweetBody = $("<div class='tweetBody'/>").html($.linkTwitterUsernames(tweet.text));
          var author = 
            $("<div class='author'/>")
              .append($("<span class='displayName'/>").html($.twitterURL(tweet)))
              .append($.twitterImage(tweet));
          
          var createdAt = 
            $("<div class='createdAt'></div>")
              .html(new Date(tweet.created_at).toUTCString());
          
          tweetWrapper
            .append(author)
            .append(tweetBody)
            .append(createdAt)
            .appendTo(wrapper);
        });
        
        var tweetElements = $(wrapper.html()).hide();
        
        if(target.find(".tweet").length) {
          target.find(".tweets").prepend(tweetElements);
          if(currentlyFilteredToSelf || currentlyFilteredToAll) {
            tweetElements.fadeIn("slow");
          } else {
            var correspondingAnchor = $("a#" + builder.cssClass);
            var num = Number(correspondingAnchor.data("unreadCount")) + tweets.length;
            if(num) { correspondingAnchor.data("unreadCount", num); }
          }
        } else {
          target.find(".tweets").append(tweetElements);
        }
      }
      
      if(currentlyFilteredToSelf) {
        showTweets(target, "." + builder.cssClass, showTweetCount("#" + builder.cssClass));
      } else if(currentlyFilteredToAll) {
        showTweets(target, ".tweet", 40);
      }
    };
    
    options.onUpdate = function(tweets) { handleTweets(tweets); };
    builder.jitter = $.jitter(options);
    builder.cssClass = builder.jitter.feedClass();
    builder.feedTitle = builder.jitter.feedTitle();
    
    var filterLink = 
      $("<a/>")
        .html(builder.feedTitle)
        .attr({
          href: "#",
          id: builder.cssClass
        })
        .click(function() { 
          triggerFilterLink(this);
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
      
    self.showTweets = showTweets;
    self.showTweetCount = showTweetCount;
    return self;
  };
})(jQuery);