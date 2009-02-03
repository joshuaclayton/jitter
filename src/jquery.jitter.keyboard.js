(function($) {
  $.jitter.keyboard = {
    enable: function() {
      $(document).data("keyboard-enabled", true);
      if($(document).data("keyboard-bound")) { return; }
      
      $(document).keydown(function(e) {
        if($(document).data("keyboard-enabled") === false) { return; }
        if (/(input|textarea|select)/i.test(e.target.nodeName)) { return; }
        
        var keyPressed = String.fromCharCode(e.which);
        
        if($.jitter.keyboard.mappings[keyPressed] || $.jitter.keyboard.mappings[e.which]) {
          e.preventDefault();
          $.jitter.keyboard.mappings[keyPressed] ? $.jitter.keyboard.mappings[keyPressed]() : $.jitter.keyboard.mappings[e.which]();
        }
        
        var number = new Number(keyPressed);
        if(number && number >= 0) {
          var anch = $(".jitter-filters a:eq(" + number + ")");
          if(anch) { e.preventDefault(); anch.trigger("click"); }
        }
      });
      
      $(document).data("keyboard-bound", true);
      $.log("Keyboard enabled");
    },
    disable: function() {
      $(document).data("keyboard-enabled", false);
      $.log("Keyboard disabled");
    },
    mappings: {
      "I": {
        fn: $.jitter.window.markAsRead,
        description: "Mark visible tweets as read"
      },
      "O": $.jitter.window.currentTweet.openAuthorTwitterLink,
      "P": $.jitter.window.currentTweet.openLinks,
      "37": $.jitter.window.currentTweet.setToFirst,
      "38": $.jitter.window.currentTweet.setToPrevious,
      "39": $.jitter.window.currentTweet.setToLast,
      "40": $.jitter.window.currentTweet.setToNext
    }
  };
})(jQuery);