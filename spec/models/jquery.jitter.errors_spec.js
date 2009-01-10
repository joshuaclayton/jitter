Screw.Unit(function() {
  describe("$.jitter.errors", function() {
    describe("invalidSearchRequest", function() {
      var errors;

      before(function() {
        errors = $.jitter.errors.invalidSearchRequest;
      });
      
      it("should have the correct name", function() {
        expect(errors.name).to(equal, "Invalid Search Request");
      });
      
      it("should have a message assigned", function() {
        expect(errors.message).to_not(be_empty);
      });
    });
    
    describe("invalidGroupTimelineRequest", function() {
      var errors;

      before(function() {
        errors = $.jitter.errors.invalidGroupTimelineRequest;
      });
      
      it("should have the correct name", function() {
        expect(errors.name).to(equal, "Invalid Group Timeline Request");
      });
      
      it("should have a message assigned", function() {
        expect(errors.message).to_not(be_empty);
      });
    });
    
    describe("invalidUserTimelineRequest", function() {
      var errors;

      before(function() {
        errors = $.jitter.errors.invalidUserTimelineRequest;
      });
      
      it("should have the correct name", function() {
        expect(errors.name).to(equal, "Invalid User Timeline Request");
      });
      
      it("should have a message assigned", function() {
        expect(errors.message).to_not(be_empty);
      });
    });
  });
});