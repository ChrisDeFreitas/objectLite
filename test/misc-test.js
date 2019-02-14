/*
  misc-test.js

	objectLite.js test cases

	requires: mocha, chai
*/

'use strict'

const debug = false
//const debug = true


process.on('uncaughtException', function(err1){
  console.error('Process.uncaughtException event:', err1.toString())
  console.error('Stack trace:', err1)
})
process.on('unhandledRejection', function (reason, promise) {
	console.error('Process.unhandledRejection event:', {reason: reason, promise: promise})
//	console.error('Stack trace:', err1)
});

const fs = require("fs"),
			chai = require('chai'),
			assert = require('chai').assert,
			expect = require('chai').expect
			//, should = require('chai').should()
const db = require("../lib/objectLite.js"),
			log = console.log,
			err = console.error,
			dir = console.dir

let testFile = "./test/test3.db"

//chai.config.includeStack = true
//chai.config.showDiff = false

let list = [
	{a:2,b:22,c:222,id:2, d:[1,2], e:{aa:1, bb:2} },
	{a:1,b:11,c:111,id:1, d:[-1,0], e:{aa:11, bb:22}},
	{a:4,b:44,c:444,id:4},
	{a:3,b:33,c:333,id:3},
	{a:'a',b:'aa',c:'aaaghh',id:6},
	{a:'b',b:'bb',c:'bbbcff',id:7},
/*
	{a:5,b:55,c:555,id:5},
	{a:'c',b:'cc',c:'ccc',id:8},
	{a:'d',b:'dd',c:'ddd',id:9},
	{a:'e',b:'ee',c:'eee',id:10},
	*/
]

describe('Test objectLite misc methods', function() {
	//before(function(){});

	describe.skip(`db.compress() and db.decompress() tests`, function() {
		let deflated = null

    it(`should return compressed version of list as base64 string`, function() {
			deflated = db.compress(list)
			//log('Result:\n', deflated)
	    expect(deflated).is.a('string')
	  })
		it(`should return decompressed list as string`, function() {
			let result = db.decompress(deflated)
			//log('Result:\n', result)
			result = JSON.parse(result)
	    expect(result).is.an('array')
	  })

	})

	describe.skip('Test objectLite persist methods', function() {
		let key = 'test.persist.key', val='test.persist.val'

		before( () => dbInit() )

		describe(`test db.presist("${key}") when perist table undefined`, function() {
	    it(`should return null`, async function() {
				let result = await db.persist(key)
				//log('Result:\n', result)
		    expect(result).is.null
		  })
		})

		describe(`test db.presist("${key}", "${val}" ) when perist table undefined`, function() {
	    it(`should return true`, async function() {
				let result = await db.persist(key, val)
				//log('Result:\n', result, key, val)
		    expect(result).is.true
		  })
			it(`should return "${val}"`, async function() {
				let result = await db.persist(key)
				//log('Result:\n', result)
		    expect(result).equals(val)
		  })
		})

		describe(`test db.presist("${key}", null), delete function`, function() {
	    it(`should delete persist.key="${key}"`, async function() {
				let result = await db.persist(key, null)
				//log('Result:\n', result)
		    expect(result).is.true
		  })
			it(`should return null`, async function() {
				let result = await db.persist(key)
				//log('Result:\n', result)
		    expect(result).is.null
		  })
		})

		let kk = key+'1'
		describe(`test multiple calls to db.presist("${kk}", "..." )`, function() {
	    it(`should create new key "${kk}" and return true`, async function() {
				let result = await db.persist(kk, val+'1')
				//log('Result:\n', result)
		    expect(result).is.true
		  })
			it(`should update key "${kk}" and return true`, async function() {
				let result = await db.persist(kk, val+'2')
				//log('Result:\n', result)
		    expect(result).is.true
		  })
			it(`should update key "${kk}" and return true`, async function() {
				let result = await db.persist(kk, val+'3')
				//log('Result:\n', result)
		    expect(result).is.true
		  })
			it(`should count(persist.key = "${kk}") = 1`, async function() {
				let result = await db.cnt('persist', {key:kk})
				//log('Result:\n', result)
		    expect(result).equals(1)
		  })
			it(`should return "${val}3"`, async function() {
				let result = await db.persist(kk)
				//log('Result:\n', result)
		    expect(result).equals(val+'3')
		  })
		})
		after( () => dbClose() )
	})

	describe.skip('Test objectLite transfer method', function() {
		let options = {
			from:{
				type:'sqlite',
				file:'/srv/nservices/data/heart/data/heart-data.db',
				table:'jst',
				//columnsClause:'',
				//whereClause:'',
			},
			to:{
				type:'local',
				table:'userdata20180909',	//'userdata'	//
				emptyTable:true,
				//fromTable:'jst',		<<< automatically assigned in .transfer()
			}
		}

		before( () => dbInit('/srv/nservices/data/heart/data/heart-data.sqlite') )

		describe(`test move userdata table from: "${options.from.file}" to:"${options.to.table}"`, function() {
	    it(`should return true`, async function() {
				let result = await db.transfer(options)
				log('Result:\n', result)
		    expect(result).is.true
		  })
		})

		describe(`test move users table from: "/srv/nservices/data/heart/data/heart-users.db"`, function() {
	    it(`should return true`, async function() {
				options.from.file = '/srv/nservices/data/heart/data/heart-users.db'
				options.to.table = 'users20180909'		//'users'		//
				let result = await db.transfer(options)
				log('Result:\n', result)
		    expect(result).is.true
		  })
		})

		after( () => dbClose() )
	})
})

function dbInit( afilename ){
	if(db.inited) return
	db.init({
		debug:debug,
		//debug:false,
		//defaultIDColumnName:'id',
		fileName:(afilename===undefined ?testFile :afilename)
	})
	if(debug) log(`dbInit( ${(afilename===undefined ?testFile :afilename)} ): done.`)		//, callerGet(2) )
}
function dbClose(){
	if(!db.inited) return
	db.close()
}
