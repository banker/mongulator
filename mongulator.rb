require 'rubygems'
require 'sinatra'
require 'json'
require 'mongo'

CONN = Mongo::Connection.new
enable :sessions

get '/' do 
  send_file 'public/index.html'
end

post '/insert' do 
  @coll = CONN.db('testing').collection(params['name'])
  @coll.insert(JSON.parse(params['doc']))
end

post '/update' do 
  @coll  = CONN.db('testing').collection(params['name'])
  query  = JSON.parse(params['query'])
  doc    = JSON.parse(params['doc'])
  upsert = (params['upsert'] == 'true')
  multi  = (params['multi'] == 'true')
  @coll.update(query, doc, :upsert => upsert, :multi => multi)
end

post '/remove' do 
  @coll = CONN.db('testing').collection(params['name'])
  @coll.remove(JSON.parse(params['doc']))
end
