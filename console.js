/*
  console.js

	objectLite.js development code

 */

 'use strict'

const db = require("./lib/objectLite.js")

process.on('uncaughtException', function(err1){
  console.error('Process.uncaughtException event:', err1.toString())
  console.error('Stack trace:', err1)
})
process.on('unhandledRejection', function (reason, promise) {
	console.error('Process.unhandledRejection event:', {reason: reason, promise: promise})
})


var debug=false	//true	//

const log = console.log,
			ui = module.exports.ui = require('./lib/ui.js')

log('objectLite.js Testing')
var timestart = ui.calc.timeStart()

const dataFile = "./console-test.db"
const userRec = {
	id: {type:'primaryKey'},
	accessToken: {type:'string'},
	created: {type:'string'},
	ip: {type:'string'},
	lastlogin: {type:'string'},
	name: {type:'string'},
	updated: {type:'string'}
}
const dataRec = {
	id: {type:'primaryKey'},
	by: {type:'string'},
	created: {type:'string'},
	img1: {type:'string'},
	img2: {type:'string'},
	img3: {type:'string'},
	caption1: {type:'string'},
	caption2: {type:'string'},
	caption3: {type:'string'},
	note: {type:'string'},
	title: {type:'string'},
	uid: {type:'string'},
	updated: {type:'string'}
}

databaseDelete()

if( !db.init({
	debug:debug,
	fileName:dataFile
}) ){
	log('>>> init error:', db.lastError)
	log('Done:', ui.calc.timeEnd(timestart, 'ms') )
	process.exit(1)
}

//main:
(async function(){
	let tmp = null, result=null
	await createUsers()
	await createUserData()
	await userAdd('chrisd@chrisd.com')
	await userAdd('ulli@ulli.com')
	await userAdd('miriam@miriam.com')
	await userAdd('user to be deleted')
	await userDel('user to be deleted')
	tmp = 'chrisd@chrisd.com'
	result = await userData(tmp, true)
	log(`\nData for user "${tmp}":\n`, result, '\n')
	tmp = 'xxx'
	result = await userFind(tmp, true)
	log(`\nFind user "${tmp}":`, result, '\n')
	status('Done.')
})()

function databaseDelete(){
	const fs = require("fs")
	if(fs.existsSync(dataFile)){
		let dt = new Date(),
		 		ts = `${dt.getFullYear()}${ui.calc.padNumber(dt.getMonth()+1, 2)}${ui.calc.padNumber(dt.getDate(),2)}`
					+ `-${ui.calc.padNumber(dt.getHours(), 2)}${ui.calc.padNumber(dt.getMinutes(), 2)}${ui.calc.padNumber(dt.getSeconds(), 2)}`
					+ `-${ui.calc.padNumber(dt.getMilliseconds(), 3)}`
		fs.copyFileSync(dataFile, `./temp/console-test-${ts}.db`)		//backup dataFile
		fs.unlinkSync(dataFile)		// delete old test files
	}
}

async function createUsers(){
	status()
	let promise = await db.exists('users')
	if(promise!==false){
		status('Table exists: users')
	}
	else{
		promise = await db.create('users', userRec, 'id')
		if(promise.done)
			promise = await db.run('create index idxUsersName on users(name);')
 		if(promise.done)
	 		promise = await db.run('create index idxUsersAccesstoken on users(accesstoken);')
		if(debug) log('set() results:', promise)
		status(`created table: "users"`)
	}
}
async function createUserData(){
	status()
	let promise = await db.exists('userdata')
	if(promise!==false){
		status('Table exists: userdata')
	}
	else{
		let dt = new Date().toLocaleString()
		promise = await db.create('userdata', dataRec, 'id')
		if(promise.done)
			promise = await db.run('create index idxUserdataUid on userdata(uid)')
		if(promise.done){
			promise = await db.set('userdata', {
				by: 'Chris',
				note: {type:'string'},
				title: 'Test record',
				uid: 1,
				created: dt,
				updated: dt
			})
			if(debug) status('set() results:', promise)
			status(`created table: "userdata"`)
		}
	}
}

async function userAdd(name){
	status()
	let dt = new Date().toLocaleString()
	let promise = await db.set('users', {
		created: dt,
		name: name,
		updated: dt
	})
	if(promise.done)
		status(`added user: "${name}", id=${promise.lastID}`)
	else
		throw promise
}
async function userDel(name){
	status()
	let sql = `delete from "users" where name = "${name}"`
	let promise = await db.run(sql)
	if(promise.done)
		status(`deleted user: "${name}"`)
	else
		throw promise
}
async function userData(name, simple){
	//assume: simple = true: select id, uid, created, updated, title
	status()
	if(simple == null) simple = false
	let col = (typeof name == 'number' ?'uid' :'name'),
			sql = null,
			sel = (simple ?'id, uid, created, updated, title' :'*')

	if(col==='name')
		sql = `Select ${sel} from userdata where uid in (select id from users where name = "${name}")`
	else
		sql = `Select ${sel} from userdata where uid = ${name}`
	//status(sql)
	let promise = await db.all(sql)
	if(promise.constructor === Array){
		//status(promise)
		return promise
	}else
		throw promise
}
async function userFind(name, simple){
	//assume: simple = true: return true/false
	status()
	if(simple == null) simple = false
	let flt = (typeof name == 'number' ?{'id':name} :{'name':name}),
			promise = null

	//status(flt)
	if(simple){
		promise = await db.cnt('users', flt)
		return (promise > 0)
	}
	else{
		promise = await db.get('users', flt)
		if(promise.constructor === Array){
			status(promise > 0)
			return promise
		}else
			throw promise
	}
}

function status(msg){
	//if(!debug) return
	if(msg==null) msg = caller(3)
	console.log(ui.calc.timeEnd(timestart, 'ms')+':', msg)
}
function caller(level, errorObj) {
	let result = callerGet(level, errorObj)
	return (result.name != null ?result.name+'()' :result.file.split('\\').pop())
					+':'+result.row+':'+result.col
}
function callerGet(level, errorObj) {
		if(!level) level=0
		var stackTrace = require('stack-trace');
  	var trace = (errorObj  ?stackTrace.parse(errorObj) :stackTrace.get(errorObj) )
		if(level >= trace.length) level = trace.length -1
    var func = trace[level];
    return {
        typeName: func.getTypeName(),
        name: func.getFunctionName(),
        //method: func.getMethodName(),
        file: func.getFileName(),
        row: func.getLineNumber(),
				col: func.getColumnNumber(),
        //topLevelFlag: func.isToplevel(),
        //nativeFlag: func.isNative(),
        //evalFlag: func.isEval(),
        //evalOrigin: func.getEvalOrigin()
    };
}
function writeDbErrors() {
	if(db == null) return
	console.log( 'db.lastError:', db.lastError )
	console.log( 'db.lastErrorNo:', db.lastErrorNo )
	console.log( 'db.lastErrorCode:', db.lastErrorCode )
	console.log( 'db.lastErrorLoc:', db.lastErrorLoc )
	console.log( 'db.statusMsg:', db.statusMsg )
	console.log( 'db.lastSql:', db.lastSql )
}
