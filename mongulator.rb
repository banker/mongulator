require 'rubygems'
require 'mongo'
require 'sinatra'
require 'json'

configure do
  CONN = Mongo::Connection.new
  DB   = 'mongulator'
end

enable :sessions

def user_scope
  session['user_scope'] ||= BSON::ObjectId.new.to_s
end

def scoped_collection(name)
  CONN[DB][user_scope + '.' + name]
end

get '/' do
  send_file 'public/index.html'
end

post '/insert' do
  coll = scoped_collection(params['name'])
  if coll.count < 200
    coll.insert(JSON.parse(params['doc']))
  end
end

post '/update' do
  coll   = scoped_collection(params['name'])
  query  = JSON.parse(params['query'])
  doc    = JSON.parse(params['doc'])
  upsert = (params['upsert'] == 'true')
  multi  = (params['multi'] == 'true')
  coll.update(query, doc, :upsert => upsert, :multi => multi)
end

post '/remove' do
  coll = scoped_collection(params['name'])
  coll.remove(JSON.parse(params['doc']))
end

post '/find' do
  coll   = scoped_collection(params['name'])
  query  = JSON.parse(params['query'])
  fields = JSON.parse(params['fields'])
  fields = nil if fields == {}
  limit  = params['limit'].to_i
  skip   = params['skip'].to_i
  cursor = coll.find(query, :fields => fields, :limit => limit, :skip => skip)
  cursor.to_a.to_json
end
