#!/usr/local/bin/ruby

# This is just for testing.
require 'webrick'
include WEBrick

s = HTTPServer.new(
  :Port            => 2000,
  :DocumentRoot    => Dir::pwd + "/"
)

s.mount("/js", HTTPServlet::FileHandler, Dir::pwd + "/js/")
s.mount("/css", HTTPServlet::FileHandler, Dir::pwd + "/css/")

trap("INT") { s.shutdown }
s.start
