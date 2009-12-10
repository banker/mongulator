require 'rubygems'
require 'mongo'
require 'sinatra'
require 'json'

CONN = Mongo::Connection.new
enable :sessions

def user_db
  session["user_db"] ||= Mongo::ObjectID.new.to_s
  session["user_db"]
end

get '/' do
  send_file 'public/index.html'
end

post '/insert' do
  coll = CONN.db(user_db).collection(params['name'])
  coll.insert(JSON.parse(params['doc']))
end

post '/update' do
  coll  = CONN.db(user_db).collection(params['name'])
  query  = JSON.parse(params['query'])
  doc    = JSON.parse(params['doc'])
  upsert = (params['upsert'] == 'true')
  multi  = (params['multi'] == 'true')
  coll.update(query, doc, :upsert => upsert, :multi => multi)
end

post '/remove' do
  coll = CONN.db(user_db).collection(params['name'])
  coll.remove(JSON.parse(params['doc']))
end

post '/find' do
  coll   = CONN[user_db][params['name']]
  query  = JSON.parse(params['query'])
  fields = JSON.parse(params['fields'])
  fields = nil if fields == {}
  limit  = params['limit'].to_i
  skip   = params['skip'].to_i
  cursor = coll.find(query, :fields => fields, :limit => limit, :skip => skip)
  return JSON.generate(cursor.to_a)
end
