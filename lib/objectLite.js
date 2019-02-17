/**
 *  @module ojecctLite
 *  @author Chris DeFreitas
 *  @description  persistent Javascript object storage with sqlite with handy functions
 *
* @see sqlite performance references:
* @see 	https://stackoverflow.com/questions/1711631/improve-insert-per-second-performance-of-sqlite
* @see 	http://blog.quibb.org/2010/08/fast-bulk-inserts-into-sqlite/
*
*
 */

/*
*	ToDo: Document Here -
* 	resultStore = { changes:null, done:false, lastID:null, sql:sql}
* 	error Object
* 	fail object
 */

'use strict'

var debug = false,	//true,	//
 		sqlite= null,		//convenience...
		db 		= null,
		log 	= console.log

var objectLite = {
	version:'1.0.2',

	sqlite: require('sqlite3').verbose(),
	db:null,

	//public properties
	inited:false,					//true when db.init() called
	fileName:null,
	lastSQL:'',						//last sql statement sent to sqlite
	statusMsg:'ready',		//current status, set when functions executed

	lastError:null,
	lastErrorCode:null,
	lastErrorNo:null,
	lastErrorLoc:'',			//function, line, and col generating error

	/**
	 * Execute SQLite Select command
	 * @param  {string}   sql  sqlite sql command
	 * @param  {object}   params sqlite parameters
	 * @param  {function}	cb     callback function to handle selected objects
	 * @return {promise}      Error or array of selected objects
	 */
	all: function(sql, params, cb){
		if(params==null) params = []
		this.lastSQL = sql
		if(debug) this.status(sql)
		return new Promise((resolve, reject) => {
			db.all(sql, params, function(err,rows){
				if(err) {
					if(debug) console.error('objectLite.all() error:', err.toString())
					objectLite.errorHandler(err)
					reject(err)
				}
				else {
					if(cb) rows = cb(rows)
					resolve(rows)
				}
			})
		})
	},

 /**
 *  Run SQLite SQL command the does not return rows
 *  @param   {string}  sql  sqlite sql command
 *  @param   {obj}  params  sqlite parameters
 *  @return  {promise}	Error or array of selected objects
 */
	run: function(sql, params){
		//on success returns: {
		// changes, 	number of col changes made by Update command
		// done, 			always = true
		// lastID, 		lastID inserted, array for bulk inserts
		//sql					sql command executed
		//}
		if(params==null) params = []
		this.lastSQL = sql
		//this.lastID = null
		//this.lastChanges = null
		if(debug) this.status(sql)

		let resultStore = { /*timestamp:Date.now(),*/ changes:null, done:false, lastID:null, sql:sql}

		return new Promise(function(resolve, reject) {
			db.run(sql, params, function(err){
				if(err) {
					if(debug) console.error('objectLite.run() error:', err.toString())
					objectLite.errorHandler(err)
					reject(err)
				}
				else {
					objectLite.runResultsSave(this.lastID, this.changes, resultStore)
					//resolve( true )
					resultStore.done = true
					resolve( resultStore )
				}
			 })
		})
	},

	runResultsSave: function(lastID, changes, resultStore){
		if(resultStore.lastID === null)
			resultStore.lastID = lastID
		else
		if(Array.isArray(resultStore.lastID))
			resultStore.lastID.push(lastID)
		else //convert resultStore.lastID to array
			resultStore.lastID = [resultStore.lastID, lastID]

		if(resultStore.lastChanges === null)
			resultStore.lastChanges = changes
		else
		if(Array.isArray(resultStore.changes))
			resultStore.lastChanges.push(changes)
		else //convert resultStore.changes to array
			this.lastChanges = [resultStore.lastChanges, changes]
		//log('runResultsSave():', resultStore)
	},
	errorHandler: function(err){
		this.lastError = err.toString()
		this.lastErrorLoc = caller(2,true)
		this.lastErrorCode = (err.code ?err.code :null)
		this.lastErrorNo = (err.errno ?err.errno :null)
	},
	status: function(amsg){
		if(amsg)
			this.statusMsg = caller(2)+': '+amsg
		else
			this.statusMsg = caller(2)
		if(debug) console.error(this.statusMsg)
	},
}

objectLite.init = function(options){
	//assume: options === sqlite filename or options object
	debug = true
	if(typeof options === 'string'){
		options = {
			//debug:true,
			debug:false,
			//defaultIDColumnName:'id',
			fileName:options,
		}
	}
	else {
		if(!options.debug) options.debug = false
	}
	this.options = options
	debug = options.debug
	this.fileName = options.fileName
	sqlite = this.sqlite

	this.status()
	try{
		db = this.db = new sqlite.Database(options.fileName)
		db.on('close', error => {
			if(error==null) error = 'no errors.'
			if(debug) console.error('objectLite.close() event:', error)
		})
		db.on('error', error => {
			if(error==null) error = 'no errors.'
			if(debug) console.error('objectLite.error() event:', error)
		})
		this.inited = true
		return true
	}
	catch(err){
		if(debug) this.status( err )
		this.errorHandler(err)
		db = this.db = null
		return false
	}
}
objectLite.close = function(cb){
	if(db===null) {
		if(cb != null) cb()
		return
	}
	this.status()
	this.inited = false
	this.db.close(cb)
	db = this.db = null
}


//persistant key/value store
//default sql table === "persist"
//change table with key ===  {key, val, persistTableName}
objectLite.persistExists = []	//tables used for persistence found in database (optimization)
objectLite.persist = async function(key, val){
	//assume: key === string || key ===  {key, val, persistTableName}
	//assume: val === undefined: get operation
	//assume: val !== null: set operation
	//assume: val === null: delete operation
	if(debug) this.status()
	let result = null,
			table = 'persist'

	if(key.constructor === Object){
		if(key.table)
			table = key.table
		if(key.val)
			val = key.val
		key = key.key
	}

	if(this.persistExists.indexOf(table) < 0){
		if(val === undefined) return null

		let fnd = await this.exists(table)
		if(fnd === false){
			let result = await this.create(table, 'key,val,updated', 'key', 'TEXT')	//create persist.key as TEXT primarykey
			if(!result.done)
				throw result
		}
		this.persistExists.push(table)
	}
	if(val === undefined){
		if(debug) this.status('get')
		result = await this.get(table, {key:key} )
		//log('result', result)
		if(Array.isArray(result)) {
			if(result.length === 0) return null
			return result[0].val
		}
		throw result
	}
	if(val === null){
		if(debug) this.status('del')
		result = await this.del(table, {key:key} )
		if(result.done) return true
		throw result
	}
	if(debug) this.status('set')
	if(val.constructor !== String) val = JSON.stringify(val)
	let updated = new Date().toISOString()
	result = await this.replace(table, {key:key, val:val, updated:updated}, 'key' )
	if(result.done) return true
	throw result
}


//table methods
objectLite.create = function(name, obj, primarykey, primarykeyType){
	//assume:
	//- primarykeyType defaults to INTEGER
	//- all cols are TEXT datatype
	//- typeof obj	=== string ==> obj = 'col1, col2, col3 ...'
	//- typeof obj	=== array  ==> obj = [col1, col2, col3 ...]
	//- typeof obj	=== object  ==> obj = {col1:xxx, col2:xxx, col3:xxx ...}; values ignored
	this.status()

	let pk = (primarykey==null ?'' :primarykey.toLowerCase()),
			pktype = (primarykeyType==null ?'INTEGER' :primarykeyType),
			keys = null
	if(typeof obj === 'string') keys = obj.split(',')
	else
	if(obj.constructor === Object) keys = Object.keys(obj)
	else
	if(Array.isArray(obj)) keys = obj
	else
		throw Error(`db.create() error: obj is not a recognized type`)
	if(keys.length===0)
		throw Error(`db.create() error: no column names found in obj`)

	var sql = ''
	for(var ii=0; ii < keys.length; ii++){
		var key = keys[ii].trim()
		if(key==='rowid') continue		//column managed by sqlite
		if(sql != '') sql += ', '
		if(pk!='' && key.toLowerCase()===pk)
			sql += `"${key}" ${pktype} PRIMARY KEY`		//alias for rowid
		else
			sql += `"${key}" TEXT`
	}
	//rowid column automatically created by sqlite
	sql = `Create Table "${name}" (${sql})`
	return this.run(sql)  //returns
}
objectLite.drop = function(name){
	this.status()
	let sql = `Drop Table "${name}"`
	return objectLite.run(sql)
}
objectLite.exists = function(name){
	//return true or false
	this.status()
	let sql = `SELECT count(*) as found FROM sqlite_master WHERE type='table' AND name='${name}'`
	return this.all(sql, null, function(rows){
		return ( Array.isArray(rows) && rows[0].found > 0)
	})
}
objectLite.struc = async function(name, asCustomObject){		//return obj describing table structure
	if(asCustomObject == null) asCustomObject = false
	let sql = `PRAGMA table_info(${name})`
	if(!asCustomObject)
		return this.all(sql)

	let result = await this.all(sql)
	if(result.constructor != Array)		//col def: { cid:0, name: '', type:'', notnull:0, dflt_value:null, pk: 0 },
			return result

	//col def: {name:'', type:'', required:bool}
	let struc = []
	for(let row of result){
		let atype = null
		switch(row.type.toLowerCase()){
			case 'text': 		atype='string'; break;
			case 'integer': atype='number'; break;
			case 'real': atype='float'; break;
			default:
				atype = row.type.toLowerCase()
		}
		let obj = {
			name:row.name,
			type:atype,
			required:(row.notnull===1)
			//pk:(row.pk===1)
		}
		struc.push(obj)
	}
	return struc
}


//row methods
objectLite.cnt = function(name, filter){
	//assume: name === "sqlTableName" || [obj1, ...]
	//assume: filter = where clause or filter object: {col1: 55} or { col1:{ '=': 55 }}  or array of fitler objects: [ {col:val}, ... }]
	//return integer
	if(Array.isArray(name)) return this.cntList(name,filter)

	this.status()
	if(filter==null) filter=''
	let where = (typeof filter === 'string' ?filter : filterWhere(filter)),
			sql = `Select count(*) as found from "${name}" ${(where!='' ?'Where '+where :'')}`
	return this.all(sql, null, function(rows){
		return rows[0].found
	})
}
objectLite.get = function(name, filter='', cols = '*', order='', limit=''){
	//assume: name = table name or (full select clause and other args ignored)
	//assume: filter = where clause or filter object: {col1: 55} or { col1:{ '=': 55 }}  or array of fitler objects: [ {col:val}, ... }]
	//assume: cols = comma delimited string: 'col1, col2' suitable for select [cols] ...
	//assume: order === null || SQL Order by expression: 'col1' || 'col1, col2' || 'col1 asc' || 'col1 desc'
	//assume: limit in format: "n1, n2" where n1 = row offset, and n2 = number of rows to return
	//return array of objects from sqlite table

	if(debug) this.status( filter )
	if(Array.isArray(name)) return this.getList(name,filter)

	if(filter==null) filter=''
	if(cols==null) cols='*'
	if(order==null) order=''
	if(limit==null) limit=''
	let sql = ''
	if(name.substring(0, 6).toLowerCase() === 'select')
		sql = name
	else {
		let where = (filter.constructor === String ?filter :filterWhere(filter) )
		limit = limitConvert(limit)
		sql = `SELECT ${cols} FROM "${name}"${(where=='' ?'' :' WHERE '+where)}${(order=='' ?'' :' ORDER BY '+order)}${(limit=='' ?'' :' LIMIT '+limit)}`
	}
	return this.all(sql)
}
objectLite.set = function(name, list, primarykey){
	//use SQLite Insert or Update command to store data
	//assume: name === "sqlTableName"
	//assume: list = {col:val, ...} or [ {col:val, ...}, ... ] with same structure for all objects
	//assume: primarykey === null || "primaryKeyColumnName"
	//returns: list of ID's inserted or 0 if no inserts
	//strategy:
	//- insert if primaryeky null
	//- update if primaryeky not null
	//- use serialize(), transactions, and statements to speed insertion
	//- must use rowid due to limitation of not using it
	//  particularly:
	//    "AUTOINCREMENT does not work on WITHOUT ROWID tables"
	//    "sqlite3_last_insert_rowid() function does not work for WITHOUT ROWID tables"
	//  so unique id's would need to be manually handled
	//  see https://www.sqlite.org/withoutrowid.html

	this.status()
	if(!Array.isArray(list)) list = [list]
	let	keys = Object.keys(list[0]),
			idxPrimeKey = (primarykey==null ?-1 :keys.indexOf(primarykey)),
			placeholders = keys.map(	function(key){
					let val = list[0][key]
					return `(?)`
			}).join(', '),
			vals = list.map( rec => {
				return Object.values(rec)
			}),
			sql = ''

	if(idxPrimeKey >= 0)		//sqlite ignores rowid values on Update
		sql = `Update "${name}" set (${keys.join(',')}) = (${placeholders}) where \`${primarykey}\` = ?${idxPrimeKey+1}`
	else{
		sql = `Insert into "${name}" (${keys.join(',')}) values (${placeholders})`
	}
	this.lastSQL = sql
	if(debug) this.status(sql)

	return new Promise( function(resolve, reject){
		db.serialize( async function() {
	    db.run("begin transaction")
	    var stmt = db.prepare(sql),
					errFound = null

			let resultStore = { /*timestamp:Date.now(),*/
				changes:null, done:false, lastID:null, sql:sql
			}

			for (var ii = 0; ii < list.length; ii++) {
				if(errFound) break
		    var promise = await new Promise( function(resolve, reject){
					stmt.run( vals[ii], function(error){
						if(error){
							errFound = error
							//caught: log(222, error)
							reject(false)
						}
						else resolve(this)
						//caught: log('\n!!!', errFound)
					})
				})
				.catch(error => {
					//rejection in stmt.run() caught here
					//it forces promise var to null
					//without this catch() an uncaught exception is thrown
					//why isn't reject error attached to promise var via "await"?
					reject(errFound)
				})
				//if(promise!==false){
				if(promise){
					//log('vals[ii][idxPrimeKey]\n', vals[ii][idxPrimeKey], idxPrimeKey, vals[ii], vals)
					if(idxPrimeKey >= 0)		//update, sqlite does not return ID's
						objectLite.runResultsSave( vals[ii][idxPrimeKey], promise.changes, resultStore)
					else
						objectLite.runResultsSave(promise.lastID, promise.changes, resultStore)
				}
	    }
			if(errFound) {
				db.run("rollback transaction")
				reject(errFound)
			}
			else {
				stmt.finalize()
	    	db.run("commit")
				resultStore.done = true
				resolve(resultStore)
			}
		})
	})
	//return true
}
objectLite.replace = function(name, list, primarykey){
	//use SQLite Replace command and Transaction to update data
	//use for large datasets
	//SQLite Replace === "Insert or Replace", https://www.sqlite.org/lang_insert.html
	//assume: name === "sqlTableName"
	//assume: list = {col:val, ...} or [ {col:val, ...}, ... ] with same structure for all objects
	//assume: primarykey defined
	// return: list of ID's inserted or 0 if no inserts
	//strategy:
	// use serialize(), transactions, and statements to speed processing

	this.status()
	if(!Array.isArray(list)) list = [list]
	let	pkval = list[0][primarykey],
			keys = [], placeholders = [], sql = '',
			vals = list.map( rec => {
				return Object.values(rec)
			})

	for(let key in list[0]){
			keys.push(key)
			placeholders.push(`(?)`)
	}

	sql = `REPLACE INTO  "${name}" (${keys.join(',')}) values (${placeholders})`
	this.lastSQL = sql
	if(debug) this.status(sql)

	return new Promise( function(resolve, reject){
		db.serialize( async function() {
	    db.run("begin transaction")
	    var stmt = db.prepare(sql),
					errFound = null

			let resultStore = { /*timestamp:Date.now(),*/
				changes:null, done:false, lastID:null, sql:sql
			}

			for (var ii = 0; ii < list.length; ii++) {
				if(errFound) break
		    var promise = await new Promise( function(resolve, reject){
					stmt.run( vals[ii], function(error){
						if(error){
							errFound = error
							//caught: log(222, error)
							reject(false)
						}
						else resolve(this)
						//caught: log('\n!!!', errFound)
					})
				})
				.catch(error => {
					//rejection in stmt.run() caught here
					//it forces promise var to null
					//without this catch() an uncaught exception is thrown
					//why isn't reject error attached to promise var via "await"?
					reject(errFound)
				})
				if(promise){
					objectLite.runResultsSave( pkval, promise.changes, resultStore)
				}
	    }
			if(errFound) {
				db.run("rollback transaction")
				reject(errFound)
			}
			else {
				stmt.finalize()
	    	db.run("commit")
				resultStore.done = true
				resolve(resultStore)
			}
		})
	})
}
objectLite.del = function(name, filter){
	//assume: name === table name || SQL Delete statement
	//assume: filter === where clause or object: {col1: 55} or { col1:{ '=': 55 }}
	//return: resultStore = { changes:null, done:false, lastID:null, sql:sql}

	if(Array.isArray(name)) return this.delList(name,filter)

	if(filter==null) filter=''
	this.status( JSON.stringify(filter) )
	let sql = ''	//`Select ${cols} from "${name}" ${(where!='' ?'Where '+where :'')} ${(order ?'Order by '+order :'')}`
	if(name.substring(0, 6).toLowerCase() === 'delete')
		sql = name
	else {
		let where = (typeof filter === 'string' ?filter : filterWhere(filter))
		sql = `Delete from "${name}" ${(where!='' ?'Where '+where :'')}`
	}
	return this.run(sql)
}


//list(array of object) methods
objectLite.cntList = function(list, filter){
	//assume: list === [obj1, ...]
	//return integer
	if(typeof(list)==='string') return cnt(name,filter)
	if(filter==null) return list.length

	let result = listFilter(list,filter)
	return result.length
}
objectLite.getList = function(list, filter='', cols = '*', order=''){
	//assume: list === [obj1, ...]  ||  "Select ..."
	//assume: cols === null || "*" || "col1, ..." || [col1, ...]
	//assume: order === null || "colName"
	//return new list
	if(typeof(list)==='string') return get(list, filter, cols, order)
	if(filter==null) return list.length
	if(cols==='*') cols = null
	let result = listFilter(list,filter)
	if(order) result = listSort(result, order)
	if(cols) 	result = listSelect(result, cols)
	return result
}
objectLite.sortList = function(list, orderCol, desc = false){
	//assume: list === [obj1, ...]
	//assume: order === null || "colName"
	//assume: desc === true > sort descending
	//return list sorted
	return listSort(list, orderCol, desc)
}


//data transfer
// see misc-test.js for usage example
// used transfer old json-table-lite data
// needs more development
// uses import/export functions defined in objectLite.transfers
objectLite.transfer = async function(options){
	if(debug) this.status()

	if(options.from == null) throw  Error('objectLite.transfer() error, options.from must be defined.')
	if(options.to == null) throw  Error('objectLite.transfer() error, options.to must be defined.')

	let fromfunc = objectLite.transfers.from[ options.from.type ]
	let tofunc = objectLite.transfers.to[ options.to.type ]

	if(fromfunc == null) throw  Error('objectLite.transfer() error, options.from.type must be in objectLite.transfers.from.')
	if(tofunc == null) throw  Error('objectLite.transfer() error, options.to.type must be in objectLite.transfers.to.')

	try{
		let result = await fromfunc.exec(options.from)
		if(!result.done)
			throw result
		if(result.recs)
			options.to.recs = result.recs
		else
			options.to.recs = result
		if(result.createSQL){
			if(options.from.table === options.to.table)
				options.to.createSQL = result.createSQL
			else 		//replace table name in sql command
				options.to.createSQL = result.createSQL.replace(options.from.table, options.to.table)
			//options.to.fromTable = options.from.table
		}
		result = await tofunc.exec(options.to)
		return result
	}
	catch(error){
		this.status(error)
		console.error(error)
		return null
	}
}
objectLite.transfers = {		//this object holds all import and export functions
	from:{},	//data retrieval functions
	to:{}			//data storage functions
}
objectLite.transfers.from.sqlite = {
	dsc:'retrieve data from an sqlite file',
	args:{
		file: {type:'string' },
		table: {type:'string' },
		columnsClause: {type:'string', dsc:'used to filter columns returned' },
		whereClause: {type:'string', dsc:'used to filter records' }
	},
	exec: async function(options){
		if(debug) objectLite.status()
		// let result = await sqliteFileGet(options)
		// return result

		// if(debug) console.log('sqliteFileGet()')
		let ldb = await new sqlite.Database(options.file)
		ldb.on('close', error => {
			if(error==null) error = 'no errors.'
			if(debug) console.error(' sqliteFileGet() db close event:', error)
		})
		ldb.on('error', error => {
			if(error==null) error = 'no errors.'
			if(debug) console.error('sqliteFileGet() db error event:', error)
		})

		let cc = (options.columnsClause ?options.columnsClause :'*'),
				wc = (options.whereClause ?options.whereClause :''),
				sql = `select * from ${options.table} ${wc}`.trim(),
				createsql = `SELECT * FROM sqlite_master WHERE type='table' AND name='${options.table}'`,
				indexsql = `SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='${options.table}'`

		if(!options.file || options.file=='') throw Error('sqliteFileGet()() error, options.file is missing.')
		if(!options.table || options.table=='') throw Error('sqliteFileGet()() error, options.table is missing.')
		//if(debug)

		async function local_all(sql){

			// if(debug) console.log('sqliteFileGet().local_all()', '['+sql+']')
			if(debug) objectLite.status(sql)

			let result = await new Promise((resolve, reject) => {
				ldb.all(sql, function(err,rows){
					if(err) {
						if(debug) console.error('sqliteFileGet()() error:', err.toString())
						//objectLite.errorHandler(err)
						reject(err)
					}
					else {
						resolve(rows)
					}
				})
			})
			if(sql===createsql){
				if(result.constructor === Array)
					return result[0].sql
			}
			// else if(sql===indexsql){
			// 	console.log('sqliteFileGet().local_all().result', result)
			// 	return result
			// }
			return result
		}
		let result = {}
		result.recs = await local_all(sql)
		result.createSQL = await local_all(createsql)
		result.createIndexSQL = await local_all(indexsql)
		result.done = true
		ldb.close()
		return result
	}
}
objectLite.transfers.to.local = {
	dsc:'send data to the open database',
	args:{
		recs: {type:'array', dsc:'recs is an array of objects'},
		table: {type:'string', dsc:'table to store data' },
		//fromTable: {type:'string', dsc:'table name to replace in createSQL' },
		createSQL: {type:'string'},
		createIndex: {type:'array', dsc:'not implemented.' },
		emptyTable: {type:'bool', default:false, dsc:'true if target table should be emptied of all records before insert'}
	},
	exec: async function(options){
		//assume: objectLite is initialized
		//if(debug)
		objectLite.status()

		if(!options.recs) throw Error('objectLite.transfers.to.local() error, options.recs is missing.')
		if(!options.table || options.table=='') throw Error('objectLite.transfers.to.local() error, options.table is missing.')

		if(!options.emptyTable) options.emptyTable = false

		let result = null, sql = null

		if( await objectLite.exists(options.table) == false){
			if(!options.createSQL)
				return null

			//implement table create functionality here
			objectLite.status('create table', options.createSQL)
			result = await objectLite.run(options.createSQL)
		}
		if(options.emptyTable===true){
			console.log('empty table')
			sql = `Delete from ${options.table}`
			result = await objectLite.run(sql)
			if(!result.done) throw result
		}

		console.log('populate table')
		result = await objectLite.set(options.table, options.recs)
		if(result.done)
			return true
		return result
	}
}


//general purpose string compression
objectLite.compress = function(data){
	//assume: data is string or any type acceptable to JSON.stringify
	let ss = null
	if(typeof data != 'string'){
		ss = JSON.stringify(data)
		//log('ss',ss)
	}
	else ss = data

	let zlib = require('zlib'),
			deflated = zlib.deflateRawSync(ss, {level:1}).toString('base64')
	return deflated
}
objectLite.decompress = function(compressedString){
	//returns string
	var zlib = require('zlib'),
			inflated = zlib.inflateRawSync(new Buffer(compressedString, 'base64')).toString()
	return inflated
}


//helper functions
function limitConvert(limit){
	//convert limit argument from array or object to string
	if(limit.constructor === Array){
		let result = ''
		if(limit.length >= 1) result = limit[0]+','	//offset
		else result = '1,'
		if(limit.length > 1) result += limit[1]		//limit
		else result += '-1'
		return result
	}
	if(typeof limit === 'string'){
		return limit
	}
	if(limit.constructor === Object){
		let result = ''
		if(limit.offset) result = limit.offset+','
		else result = '1,'
		if(limit.limit) result += limit.limit
		else result += '-1'
		return result
	}
	return ''	// ???
}
function listSelect(list, cols){
	//assume: list = [ {}, ... ]
	//return new list only with cols
	if(typeof cols === 'string'){
		cols = cols.split(',')
	}
	let result = []
	for(let obj of list){
		let newObj = {}
		for(let col of cols){
			col = col.trim()
			if(obj[col])
				newObj[col] = obj[col]
			else
				newObj[col] = null
		}
		result.push(newObj)
	}
	return result
}
function listSort(list, orderCol, desc = false){
	//assume: desc === true > sort descending
	function compare(a, b) {
		if(a[orderCol].toString() < b[orderCol].toString()){
	    return -1;
	  }
		if(a[orderCol].toString() > b[orderCol].toString()){
	    return 1;
	  }
	  return 0;
	}
	function compareDesc(a, b) {
		if(a[orderCol].toString() > b[orderCol].toString() ){
	    return -1;
	  }
		if(a[orderCol].toString() < b[orderCol].toString() ){
	    return 1;
	  }
	  return 0;
	}
	if(desc===true)
		list.sort(compareDesc)
	else
		list.sort(compare)
	return list
}
function listFilter(list,filterObj){
	//assume: filterObj is an object containg filters
	//assume: possible formats  of a filter = {col1:val} || {col1:{filterOperator:val}
	//example filterObj: { col1:val, colN:{'!=':valN}, ... }
	//see opApply() for filter possible operations, =, !=, in etc
	//return list of matching elements
	let result = []
	if(filterObj==null) return result

	result = list.filter(obj => {
		return objFilter(obj, filterObj)
	})
	return result
}
function objFilter(obj, filterObj){
	//determine whether obj matches filterObj
	//return true/false
	//ToDo: allow filterObj to be an array, indicates and OR operations
	//			AND operations are specified within one object
	//			therefore OR operations use seperate objects

	//if(debug) log('objFilter():', obj, filterObj)
	if(filterObj==null) return false
	if(filterObj.constructor!==Array) filterObj = [filterObj]

	let result = false, cnt=1
	for(let filter of filterObj){
		for(let col in filter){
			if(obj[col]===undefined) result = false
			else {
				let val = obj[col],
						opObj = filter[col]
				if(opObj.constructor != Object) opObj = {'=':opObj}
				result = qryApply(val, opObj)
			}
			if(result===false)	break		//this filter failed
		}
		if(result===true)	break		//stop after the first match
	}
	if(debug) log('objFilter() result:', result)
	return result
}
function qryApply(val, opObj){
	//determine whether val matches filter operation defined in opObj
	//return true/false
	//if(debug) log('qryApply():', val, opObj)
	let result = false
	for(let op in opObj){
		let opVal = opObj[op]
		result = opApply(val, op, opVal)
		if(result===false) break
	}
	if(debug) log('qryApply() result:', result)
	return result
}
function opApply(val, op, opVal){
	//determine whether filter operation matches val
	//return true/false
	//if(debug) log('opApply():', val, op, opVal)
	let result = false

	switch(op.toLowerCase()){
		case 'eq':
		case '=':
			if(val.constructor === Array){
				if(debug) log(`${op} Array test`)
				result = (opVal.constructor === Array)
				if(result)
					result = (val.length===opVal.length)
				if(result)
					result = (val.length===val.filter( (v1, idx) => {
						return Object.is(v1, opVal[idx])
					}).length)
			}else
			if(val.constructor === Object){
				if(debug) log(`${op} Object test`)
				result = (JSON.stringify(val) === JSON.stringify(opVal))
			}else
				result = (val == opVal)
				//result = Object.is(val, opVal)
			break;
		case 'noteq':
		case '!=':
			if(val.constructor === Array){
				if(debug) log(`${op} Array test`)
				if(opVal.constructor === Array){
					result = (val.length !== opVal.length)
					if(result) break
					result = (val.length !== val.filter( (v1, idx) => {
							return Object.is(v1, opVal[idx])
					}).length)
				}
			}else
			if(val.constructor === Object){
				if(debug) log(`${op} Object test`)
				result = (JSON.stringify(val) !== JSON.stringify(opVal))
			}else
				result = (val != opVal)
			break;
		case 'lt':
		case '<':  result = (val < opVal);  break;
		case 'lteq':
		case '<=': result = (val <= opVal); break;
		case 'gt':
		case '>':	 result = (val > opVal);  break;
		case 'gteq':
		case '>=': result = (val >= opVal); break;
		case 'contains':	//must match type
			if(val.constructor === Array){
				if(debug) log(`${op} Array test`, val, opVal)
				result = ( val.indexOf(opVal) >= 0 )
			}else
			if(val.constructor === Object){
				if(debug) log(`${op} Object test`)
				result = (val[opVal] !== undefined)
			}else
			if(val.constructor === String){
				if(debug) log(`${op} String test`)
				result = ( val.indexOf(opVal) >= 0 )
			}
			break;
		case 'in':
			if(val.constructor === String){
				if(opVal.constructor === Array
				|| opVal.constructor === String){
					if(debug) log(`${op} test`)
					result = ( opVal.indexOf(val) >= 0 )
				} else
				if(opVal.constructor === Object){
					if(debug) log(`${op} Object test`)
					result = ( opVal[val] != undefined )
				}
			}
			break;
		case 'notin':
		case '!in':
			if(val.constructor === String){
				if(opVal.constructor === Array
				|| opVal.constructor === String){
					if(debug) log(`${op} test`)
					result = ( opVal.indexOf(val) < 0 )
				}
			}
			break;
		case 'like':
			if(val.constructor === Number){
				val = String(val)
			}
			if(val.constructor === String
			&& opVal.constructor === String){
				let type = 'contains',
						list = opVal.split('%')
				if(list.length === 1){		//no %, == search
					//if(debug)	log(`${op} String test - equals`, val, list[0], list)
					opVal = list[0]
					result = (val == opVal)
				}else
				if(list.length === 3){		//contains search
					if(debug) log(`${op} String test - contains`, list)
					opVal = list[1]
					result = (val.indexOf(opVal) >= 0)
				}else
				if(list[0]===''){		//ends with search
					if(debug) log(`${op} String test - end `, list)
					opVal = list[1]
					result = val.endsWith(opVal)
				}
				else{		//begins with search
					if(debug) log(`${op} String test - begin`, list)
					opVal = list[0]
					result = val.startsWith(opVal)
				}
			}
			break;
		default:
			throw Error(`opFilter() error, unknown operator received: [${op}]`)
		}
	if(debug) log('opApply() result:', result)
	return result
}

function filterWhere(filterList){
	//convert filterList to where clause
	//return where clause (without the WHERE part)
	//log('fiilterWhere', filterList)
	if(filterList == null) return ''
	if(filterList.constructor !== Array) filterList = [filterList]

	let result = ''
	for(let fltObj of filterList){
		let clause = ''
		//log('filterWhere fltObj', fltObj)
		for(let col in fltObj){
			if(clause != '') clause += ' AND '
			let obj = fltObj[col]
			if(typeof obj !== 'object') obj = {'=':obj}
			for(let op in obj){
				let val = obj[op]
				clause += opToWhere(col, op, val)
			}
		}
		if(clause != ''){
			if(result != '') result += ' OR '
			result += '('+clause+')'
		}
	}
	return result
}
function opToWhere(col, op, opVal){
	let result = ''
	opVal = (Array.isArray(opVal) ?opVal.join(',')  :JSON.stringify(opVal)	)		//escape quotes
	switch(op.toLowerCase()){
	case 'eq':
	case '=':		result += `\`${col}\` = ${opVal}`; break;			//{colName: {'=':555}}; more efficient: {colName:555}
	case 'lt':
	case '<':		result += `\`${col}\` < ${opVal}`; break;
	case 'lteq':
	case '<=':	result += `\`${col}\` <= ${opVal}`; break;
	case 'gt':
	case '>':		result += `\`${col}\` > ${opVal}`; break;
	case 'gteq':
	case '>=':	result += `\`${col}\` >= ${opVal}`; break;
	case 'noteq':
	case '!=':	result += `\`${col}\` != ${opVal}`; break;
	case 'notin':
	case '!in':	result += `\`${col}\` NOT IN (${opVal})`; break;
	case 'in':	result += `\`${col}\` IN (${opVal})`; break;
	case 'notlike':
	case '!like':	result += `\`${col}\` NOT LIKE ${opVal}`; break;
	case 'like':	result += `\`${col}\` LIKE ${opVal}`; break;
	case 'noop':	result += `\`${col}\` ${opVal}`; break;					//{colName: {noop:'is null'}}
	default:
		throw Error(`opToWhere() error, unknown operator received: [${op}]`)
	}
	//log(`opToWhere(col, ${op}, val):`, result)
	return result
}
function filterLimit(limit){
	//not used
	//assume: filter.constructor === Array
	let result = '', clause = ''
	for(let Obj of limit){
		for(let key in obj){
			key = key.toLowerCase()
			if(key==='limit')
				clause += ' LIMIT '+obj[key]
			else
			if(key==='offset')
				clause += ' OFFSET '+obj[key]
		}
	}
	if(clause != '') result = '('+clause+')'
	return result
}


//misc functions
function callerGet(level) {
		//return object specifying file info on calling function
		if(!level) level=0
		var stackTrace = require('stack-trace');
  	var trace = stackTrace.get()
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
function caller(level, includePos, includeFile){
	//return string info on calling function
  if(level===undefined) level=1
	level += 1
  if(includePos==null) includePos = false		//return row:col
  if(includeFile==null) includeFile = false		//return caller.name

	let func = callerGet(level),
   		result = ''
  if(func.name==null)
		result = require('path').basename(func.file)
	else
		result = func.name+'()'

  if(includePos===true) result = result+':'+func.row+':'+func.col
  if(includeFile===true) result = func.file+'//'+result
  return result
}


//ToDo:
let bSearch = function(recs, key, val){
	//use binary search to find val
	//recs = [ {}, ... ]
	//key = recs[n][key]
	//val = value compared to recs[n][key]
	//return = {idx, cmp}
	//assume recs sorted on key
	//assume recs[key] is fully populated; unpredicatable results with sparse population
	//assume recs.length is large enough to warrant the extra code
	let start = 0,
			end = recs.length-1,
			mid = Math.floor(end /2),		//arrays are zero based
			result = null,
			its = 0,						//safety: count iterations, should always be less that maxits
			maxits = mid+1

	if(recs.length===0)  return {idx:null, cmp:null, where:'start'}

	function cmp(rec){
		if(rec[key] === undefined) return 99
		if(rec[key] == val) return 0
		if(rec[key] > val) return -1
		return 1
	}
	result = cmp(recs[0])					//short circuit start of list
	if(result===0 || result===-1)
		return {idx:start, cmp:result, its:its, where:'initstart'}		//not in list, too small

	result = cmp(recs[end])				//short circuit end of list
	if(result===0 || result===1)
		return {idx:end, cmp:result, its:its, where:'initend'}		//not in list, too large

	while(start <= end){
		if(++its > maxits)
			throw new Error(`db.bSearch() error too many iterations, is the data sorted on ${key}?`)
		mid = Math.floor((end -start) /2) +start
		result = cmp( recs[mid] )		//arrays start at 0
		if(result === 99) {		//recs[ii][key] === undefined -- thats ok
			while(result === 99){		//this could result in endless loop--hopefully, broken by maxits
				mid++
				if(mid > end)
					throw new Error(`db.bSearch() error too many iterations, does ${key} exist in many rows?`)
				result = cmp( recs[mid] )
			}
		}
		if(result === 0){			//val found
			return {idx:mid, cmp:result, its:its, where:'itmid'}
		}else
		if(result === -1){		//search bottom half
			end = mid-1					//already searched rec[mid]
		}
		else{									//result === 1;	search top half
			start = mid+1				//already searched rec[mid]
		}
	}
	return {idx:mid, cmp:result, its:its, where:'itend'}
}

module.exports = objectLite
