Screw.Unit(function() {
  describe("$.jitter.defaults", function() {
    var defaults;
    
    before(function() {
      defaults = $.jitter.defaults;
    });
    
    it("should have a default refresh rate of 60 seconds", function() {
      expect(defaults.refreshRate).to(equal, 60);
    });
    
    it("should default to the search feed", function() {
      expect(defaults.feed).to(equal, "search");
    });
    
    it("should assign a default search of jquery", function() {
      expect(defaults.query).to(equal, "jquery");
    });
    
    it("should assign an onUpdate callback for new tweets", function() {
      var defaultCallback = function(tweets) { if(tweets[0]) { alert("Newest Tweet:\n" + tweets[0].text); } else { alert("No new tweets, sorry!"); } };
      expect(defaults.onUpdate).to(equal, defaultCallback);
    });
    
    it("should assign an onError callback", function() {
      var defaultCallback = function(error) { alert("Error: " + error.name + "\nMessage: " + error.message); };
      expect(defaults.onError).to(equal, defaultCallback);
    });
  });
});