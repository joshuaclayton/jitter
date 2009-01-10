Screw.Unit(function() {
  before(function() {
    $("#dom_test").empty();
  });
});

var stubTimer = function() {
  $.timer = function() { return {stop: function() {}, reset: function() {}}; };
};