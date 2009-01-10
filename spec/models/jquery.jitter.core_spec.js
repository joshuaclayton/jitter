Screw.Unit(function() {
  describe("$.jitter.core", function() {
    describe("function setup", function() {
      var jitter;
      
      before(function() {
        // stub out ajax call
        $.ajax = function(options) {};
      });

      it("should assign options.currentFeed to correct feed", function() {
        jitter = $.jitter({feed: "search", query: "jquery"});
        expect(jitter.options().currentFeed).to(equal, $.jitter.feeds.search);
      });
      
      describe("with potentially passed settings", function() {
        it("should use defaults if no settings are passed", function() {
          jitter = $.jitter();
          delete(jitter.options().currentFeed);
          expect(jitter.options()).to(equal, $.jitter.defaults);
        });
        
        it("should use passed settings if assigned", function() {
          jitter = $.jitter({refreshRate: 20, feed: "userTimeline", username: "username"});
          delete(jitter.options().currentFeed);
          expect(jitter.options()).to(equal, $.extend({}, $.jitter.defaults, jitter.options()));
        });
      });
      
      it("should call the jQuery timer if valid", function() {
        var timerCalled = false;
        $.timer = function() { timerCalled = true; return {stop: function() {}, reset: function() {}}; };
        jitter = $.jitter();
        expect(timerCalled).to(be_true);
      });
      
      it("should properly return feed class", function() {
        jitter = $.jitter({feed: "search", query: "Three Separate Words"});
        expect(jitter.feedClass()).to(equal, "search-three-separate-words");
      });
      
      it("should properly return feed title", function() {
        jitter = $.jitter({feed: "search", query: "Three Separate Words"});
        expect(jitter.feedTitle()).to(equal, "Search Results for 'Three Separate Words'");
      });
      
      after(function() {
        jitter.stop();
      });
    });
    
    describe("AJAX options within updateTweets", function() {
      var jitter, options;
      
      before(function() {
        $.ajax = function(opts) { options = opts; };
      });
      
      it("should be assigned a 'jsonp' data type", function() {
        jitter = $.jitter();
        expect(options.dataType).to(equal, "jsonp");
      });
      
      it("should be a GET request", function() {
        jitter = $.jitter();
        expect(options.type).to(equal, "GET");
      });
      
      after(function() {
        jitter.stop();
      });
    });
    
    describe("URL building", function() {
      var jitter, options;
      
      before(function() {
        stubTimer();
        $.ajax = function(opts) { options = opts; };
      });
      
      it("should generate the correct URLs and params", function() {
        jitter = $.jitter({feed: "search", query: "blueprint css"});
        expect(options.url).to(equal, "http://search.twitter.com/search.json?q=blueprint+css");
        jitter = $.jitter({feed: "groupTimeline", users: ["person1", "person2"], groupName: "Test Group"});
        expect(options.url).to(equal, "http://search.twitter.com/search.json?q=from%3Aperson1+OR+from%3Aperson2");
        jitter = $.jitter({feed: "friendsTimeline", username: "name", password: "pass"});
        expect(options.url).to(equal, "http://name:pass@twitter.com/statuses/friends_timeline.json");
      });
    });
    
    describe("error handling", function() {
      var jitter;
      
      before(function() {
        stubTimer();
      });
      
      it("should properly catch search errors", function() {
        var errorResult = {};
        var errorHandler = function(e) { errorResult = e; };
        jitter = $.jitter({feed: "search", query: null, onError: errorHandler});
        expect(errorResult).to(equal, $.jitter.errors.invalidSearchRequest);
        expect(jitter).to(be_undefined);
      });
      
      it("should properly catch group timeline errors", function() {
        var errorResult = {};
        var errorHandler = function(e) { errorResult = e; };
        jitter = $.jitter({feed: "groupTimeline", onError: errorHandler});
        expect(errorResult).to(equal, $.jitter.errors.invalidGroupTimelineRequest);
        expect(jitter).to(be_undefined);
      });
      
      it("should properly catch user timeline errors", function() {
        var errorResult = {};
        var errorHandler = function(e) { errorResult = e; };
        jitter = $.jitter({feed: "userTimeline", username: null, onError: errorHandler});
        expect(errorResult).to(equal, $.jitter.errors.invalidUserTimelineRequest);
        expect(jitter).to(be_undefined);
      });
    });
  });
});