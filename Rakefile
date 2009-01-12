require 'rake'

class File
  # string output from file
  def self.path_to_string(path)
    File.new(path).read
  end
end

JITTER_ROOT         = File.expand_path(File.dirname(__FILE__))
JITTER_SOURCE_DIR   = File.join(JITTER_ROOT, "src")
JITTER_BUILD_DIR    = File.join(JITTER_ROOT, "jquery")

desc "Build"
task :build do
  Dir.chdir(JITTER_SOURCE_DIR) do
    File.open(output_path = File.join(JITTER_BUILD_DIR, 'jquery.jitter.js'), 'w+') do |result|
      puts "Building Jitter to #{output_path}"
      ["jquery.jitter.core", "jquery.jitter.defaults", "jquery.jitter.errors", "jquery.jitter.feeds", "jquery.jitter.builder", "jquery.fn.jitter"].each do |js_file|
        result << File.path_to_string(File.join(JITTER_SOURCE_DIR, "#{js_file}.js"))
        puts "  Added #{js_file}"
      end
    end
  end
end