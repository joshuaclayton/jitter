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
})(jQuery);