require 'rake'

class File
  # string output from file
  def self.path_to_string(path)
    File.new(path).read
  end
end

JITTER_ROOT         = File.expand_path(File.dirname(__FILE__))
JITTER_SOURCE_DIR   = File.join(JITTER_ROOT, "src")
JITTER_BUILD_TARGET = File.join(JITTER_ROOT, "jquery")

desc "Build"
task :build do
  Dir.chdir(JITTER_SOURCE_DIR) do
    File.open(File.join(JITTER_BUILD_TARGET, 'jquery.jitter.js'), 'w+') do |result|
      ["jquery.timer", "jquery.jitter.core", "jquery.jitter.defaults", "jquery.jitter.errors", "jquery.jitter.feeds"].each do |js_file|
        result << File.path_to_string(File.join(JITTER_SOURCE_DIR, "#{js_file}.js"))
      end
    end
  end
end