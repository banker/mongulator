require 'rubygems'
require 'sinatra'
require 'json'
require 'mongo'

@connection = Mongo::Connection.new
enable :sessions

get '/' do 
  
end

post '/insert' do 
  @coll = @connection.db.collection(params['name'])
  @coll.insert(params['doc'])
end

post '/update' do 

end

post '/remove' do 

end
