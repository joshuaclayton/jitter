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
                <div class="createdAt"/>\
                <div class="backtrack"/>\
              </div>\
              <div class="tweetBody span-11 append-1 last"/>\
            </div>')
            .addClass(builder.cssClass())
            .addClass("author-" + $.twitter.username(tweet))
            .find(".tweetBody").html($.twitter.linkedText(tweet)).end()
            .find(".author .displayName").html($.twitter.userURL(tweet)).end()
            .find(".author .tweetImage").append($.twitter.image(tweet)).end()
            .find(".createdAt").html($.twitter.timestamp(tweet)).end()
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
    
    options.onUpdate = function(tweets) { handleTweets(tweets); };
    
    builder.jitter = $.jitter(options);
    builder.cssClass = function() { return builder.jitter.feedClass(); };
    builder.feedTitle = function() { return builder.jitter.feedTitle(); };
    builder.showTweets = showTweets;
    builder.showTweetCount = showTweetCount;
    
    var filterBuilder = $.jitter.builder.filter(target, builder);
    filterBuilder.buildFilterLink();
    
    builder.jitter.start();
    return self;
  };
  
  $.jitter.builder.filter = function(target, builder) {
    var self = {};
    
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
    };
    
    var buildFilterLink = function() {
      $("<a/>")
        .html(builder.feedTitle())
        .attr({
          href: "#",
          id: builder.cssClass()})
        .click(function() { triggerFilterLink(this); return false; })
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
    };
    
    
    if(!target.find(".jitter-filters").length) {
      var filters = $("<div class='jitter-filters span-6'/>").html("<h1>Jitter!</h1>");
      
      $("<a/>")
        .html("All Feeds")
        .attr({href: "#", id: "tweet"})
        .addClass("active allTweets")
        .click(function () { triggerFilterLink(this); return false; })
        .appendTo(filters);
      target.prepend(filters);
    }
    
    self.buildFilterLink = buildFilterLink;
    return self;
  };
})(jQuery);