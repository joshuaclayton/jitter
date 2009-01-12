(function($) {
  $.jitter.builder = function(target, options) {
    var builder = {},
        self = {},
        options = options || {};
    
    var showTweetCount = function(anchor) {
      var ct = $(anchor).attr("unreadCount");
      return (ct > 20 ? ct : 20);
    };
    
    var showTweets = function(tweetsParent, tweetClass, numberOfTweetsToDisplay) {
      tweetsParent.find(".tweet").hide();
      tweetsParent.find(tweetClass + ":lt(" + numberOfTweetsToDisplay + ")").show();
    };
    
    var triggerFilterLink = function(anchor) {
      var $anchor = $(anchor);
      $anchor.parent().children().removeClass("active");
      $anchor.
        addClass("active").
        attr("displayTweets", "." + $anchor.attr("id"));
      showTweets(target, "." + $anchor.attr("id"), showTweetCount($anchor));
    };
    
    var handleTweets = function(tweets) {
      var currentlyFilteredToSelf = target.find(".jitter-filters a.active").attr("id").indexOf(builder.cssClass) >= 0;
      var currentlyFilteredToAll = target.find(".jitter-filters a.active").length ? (target.find(".jitter-filters a.active").attr("class").match("allTweets") ? true : false) : false;

      if(tweets.length) {
        var wrapper = $("<div/>");

        $.each(tweets, function(index, tweet) {
          var tweetWrapper = 
            $("<div class='tweet clearfix'/>").
              addClass(builder.cssClass).
              addClass("author-" + (tweet.user ? tweet.user.screen_name : tweet.from_user));

          var tweetBody = $("<div class='tweetBody'/>").html(tweet['text']);
          var authorImage = $("<img/>").attr("src", (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url));
          var author = 
            $("<div class='author'/>").
              append(
                $("<span class='displayName'/>").html(tweet.user ? tweet.user['name'] : tweet.from_user)
              ).
              append(
                $("<img/>").attr("src", (tweet.user ? tweet.user.profile_image_url : tweet.profile_image_url))
              );
          
          var createdAt = 
            $("<div class='createdAt'></div>").
              html(
                new Date(tweet.created_at).toUTCString()
              );

          tweetWrapper.
            append(author).
            append(tweetBody).
            append(createdAt).
            appendTo(wrapper);
        });

        var tweetElements = $(wrapper.html()).hide();

        if(target.find(".tweet").length) {
          target.prepend(tweetElements);
          if(currentlyFilteredToSelf || currentlyFilteredToAll) {
            tweetElements.fadeIn("slow");
          } else {
            var correspondingAnchor = $("a#" + builder.cssClass);
            var num = new Number(correspondingAnchor.attr("unreadCount")) + tweets.length;
            if(num) { correspondingAnchor.attr("unreadCount", num); }
          }
        } else {
          target.append(tweetElements);
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
      $("<a/>").html(builder.feedTitle).
        addClass("active").
        attr("href", "#").
        attr("id", builder.cssClass).
        attr("unreadCount", 0).
        click(function() {
          triggerFilterLink(this);
        }).
        appendTo(target.find(".jitter-filters"));
    
    self.showTweets = function() { return showTweets(); };
    return self;
  };
})(jQuery);