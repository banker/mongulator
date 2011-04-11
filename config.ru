require 'rubygems'
require 'bundler/setup'
require "./mongulator"

set :public, './public'
set :environment, :production
run Sinatra::Application
