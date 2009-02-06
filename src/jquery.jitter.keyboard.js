(function($) {
  $.jitter.keyboard = {
    enable: function() {
      $(document).data("keyboard-enabled", true);
      if($(document).data("keyboard-bound")) { return; }
      
      $(document).keydown(function(e) {
        if($(document).data("keyboard-enabled") === false) { return; }
        if (/(input|textarea|select)/i.test(e.target.nodeName)) { return; }
        
        var keyPressed = String.fromCharCode(e.which),
            mappedKeyboardAction = $.jitter.keyboard.mappings[keyPressed] || $.jitter.keyboard.mappings[e.which];
        
        if(mappedKeyboardAction) {
          e.preventDefault();
          mappedKeyboardAction.fn.apply(this, mappedKeyboardAction.args);
        }
      });
      
      $(document).data("keyboard-bound", true);
    },
    disable: function() {
      $(document).data("keyboard-enabled", false);
    },
    mappings: {
      "E": {
        fn: $.jitter.window.tweets.read,
        args: [{visible: true, feed: $.jitter.window.currentFeed}],
        description: "Mark all visible tweets as read"
      },
      "A": {
        fn: $.jitter.window.tweets.archive,
        args: [{visible: true, feed: $.jitter.window.currentFeed}],
        description: "Archive all visible tweets"
      },
      "X": {
        fn: $.jitter.window.tweets.current.destroy,
        args: [{moveTo: function() { 
          var $next = $("div.tweet.current").nextAll(":visible:first"),
              $prev = $("div.tweet.current").prevAll(":visible:first");
          return ($next.length ? $next : $prev); }}],
        description: "Remove current tweet"
      },
      "O": {
        fn: $.jitter.window.tweets.current.openAuthorTwitterLink,
        description: "Open current tweet author's Twitter page"
      },
      "P": {
        fn: $.jitter.window.tweets.current.openLinks,
        description: "Open all links within current tweet"
      },
      "37": {
        fn: $.jitter.window.tweets.current.setToFirst,
        description: "Navigate to first tweet",
        key: "&larr;"
      },
      "38": {
        fn: $.jitter.window.tweets.current.setToPrevious,
        description: "Navigate to previous tweet",
        key: "&uarr;"
      },
      "39": {
        fn: $.jitter.window.tweets.current.setToLast,
        description: "Navigate to last tweet",
        key: "&rarr;"
      },
      "40": {
        fn: $.jitter.window.tweets.current.setToNext,
        description: "Navigate to next tweet",
        key: "&darr;"
      }
    }
  };
})(jQuery);