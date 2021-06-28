/*
  test.js

	objectLite.js test cases

	requires: mocha,chai
*/

'use strict'

const debug = false
// const debug = true


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

let testFile = "./test/test3.db",
 		fileexists = null,
		testpkInit = false

//chai.config.includeStack = true
//chai.config.showDiff = false

describe('create database data', function() {

		it(`should create new ${testFile} and load tables: test1, testpk`, async function() {
			await dbFileInit()
			await dbDataInit()
		})

});

describe('Test objectLite table and row methods', function() {
	before(function(){
			fileexists = fs.existsSync(testFile)
			if(fileexists != true){
				throw Error(`Data "${testfile}" not found; no testing possible.`)
			}
	});

	describe(`db.init() and db.close() tests`, function() {
		describe(`db.init(fileName)`, function() {
	    it(`should open: ${testFile}`, function() {
	      assert.equal(true, db.init( testFile ))
	    })
			it(`should close db`, function(done) {
				db.close( error => done(error) )
			})
	  })
		describe(`db.init(options)`, function() {
	    it(`should open: ${testFile}`, function() {
	      assert.equal(true, db.init( {debug:false, fileName:testFile} ))
	    })
			it(`should close db`, function(done) {
				db.close( error => done(error) )
			})
	  })

	// this test requires more analysis
	// because the file name may be invalid
	// but init succeeds because no  data is written to file
	//
	// 	describe(`db.init(fileName) where filename does not exist`, function() {
	// 		let testFile2 = "does/not/exist.sqlite"
	//     it(`should return error: "${testFile2}"`, async function() {
	// 			let promise = await db.init( testFile2 )
	// 			//log('promise',promise)
	// 			expect(promise).is.true
	//     })
	// 		it(`should close db`, function(done) {
	// 			db.close( error => done(error) )
	// 		})
	//   })

	})

	describe('db.create() and db.drop() tests', function() {
		before( () => dbInit() )

		describe('db.create(name, obj) typeof obj === object', function() {

			it(`should create table: testCreateObj`, async function() {
				let promise = await db.create('testCreateObj',{	a:1, b:2, c:3 })
				expect(promise.done).is.true
	    })
			it(`should drop table: testCreateObj`, async function() {
				let promise = await db.drop('testCreateObj')
				expect(promise.done).is.true
	    })

		})

		describe('db.create(name, obj) typeof obj === string', function() {

			it(`should create table: testCreateStr`, async function() {
				let promise = await db.create('testCreateStr', 'a, b, c')
				expect(promise.done).is.true
	    })
			it(`should drop table: testCreateStr`, async function() {
				let promise = await db.drop('testCreateStr')
				expect(promise.done).is.true
	    })

		})

		describe('db.create(name, obj) typeof obj === array', function() {

			it(`should create table: testCreateArr`, async function() {
				let promise = await db.create('testCreateArr', ['a', 'b', 'c'])
				expect(promise.done).is.true
	    })
			it(`should drop table: testCreateArr`, async function() {
				let promise = await db.drop('testCreateArr')
				expect(promise.done).is.true
	    })

		})

		describe('db.create(name, obj) with primary key', function() {

			it(`should create table: testCreateId`, async function() {
				let promise = await db.create('testCreateId', 'id, a, b, c', 'id')
				expect(promise.done).is.true
	    })
			it(`should drop table: testCreateStr`, async function() {
				let promise = await db.drop('testCreateId')
				expect(promise.done).is.true
	    })

		})
	})

	describe(`db.exists() test`, function() {
		before( () => dbInit() )

    it(`should return true if test1 exists in database`, async function() {
			let promise = await db.exists('test1')
			expect(promise).is.true
    })
  })

	describe(`db.get() tests`, function() {
		before( () => dbInit() )

		describe(`db.get(table, [{a:2},{a:4}]) - OR functionality`, function() {
	    it(`should return rows where a=2 or a=4`, async function() {
				let promise = await db.get('test1', [{a:2},{a:4}])
				//log('Results:\n', promise)
				expect(promise).be.an('array')
				expect(promise.length).equals(2)
				expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])
				expect(promise[0].a).to.exist
				expect(promise[0].a).to.equal('2')
				expect(promise[1].a).to.equal('4')

			})
	  })
		describe(`db.get(table, {a:2, b:{like:'%2'}}) - AND functionality`, function() {
	    it(`should return one row where a=2 and b=22`, async function() {

				let promise = await db.get('test1', {a:2, b:{like:'%2'}})
				//log('Results:\n', promise)
				expect(promise).be.an('array')
				expect(promise.length).equals(1)
				expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])
				expect(promise[0].a).to.exist
				expect(promise[0].a).to.equal('2')
				expect(promise[0].b).to.equal('22')

			})
	  })
		describe(`db.get(table,null,null,null,'2,1') - LIMIT functionality`, function() {
	    it(`should return the row where a=3`, async function() {
				let promise = await db.get('test1', null,null,null, '2,1')
				//log('Results:\n', promise)
				expect(promise).be.an('array')
				expect(promise.length).equals(1)
				expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])
				expect(promise[0].a).to.equal('3')
			})
	  })

		describe(`db.get(table)`, function() {
	    it(`should return all rows from test1 table`, async function() {

				let promise = await db.get('test1')
				expect(promise).be.an('array')
				expect(promise.length).be.above(0)
				expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])

	    })
	  })
		describe(`db.get(table, filter)`, function() {
	    it(`should return rows where a=5`, async function() {

				let promise = await db.get('test1', {a:5})
				expect(promise).be.an('array')
				expect(promise.length).be.above(0)
				expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])
				expect(promise[0].a).to.exist
				expect(promise[0].a).to.equal('5')

			})
	  })
		describe(`db.get(sql)`, function() {
	    it(`should return rows where c contains 3`, async function() {

				let promise = await db.get("Select c From test1 Where c like '3%'")
				//dir(promise)
				expect(promise).be.an('array')
				expect(promise.length).be.above(0)
				expect(promise[0]).to.be.an('object').that.has.keys(['c'])
				expect(promise[0].c).to.exist
				expect(promise[0].c).to.contain('3')

			})
	  })
		describe('db.get(table, filter, cols, order)', async function() {
			it(`should return 3 rows containing b column having vaules 11,33,55, in descending order`, async function() {
				let promise = await db.get('test1', {a:{in:[1,3,5]}}, 'b', 'b desc')
				//log('Results:\n', promise)
				expect(promise).is.an('array')
				expect(promise.length).equals(3)
				expect(promise[0]).to.be.an('object').that.has.keys(['b'])
				expect(promise[0].b).equals('55')
				expect(promise[1].b).equals('33')
				expect(promise[2].b).equals('11')
			})
		});
		describe(`rowid tests (see sqlite rowid usage)`, function() {
			describe(`db.get(table, {rowid:3})`, function() {
		    it(`should return one row where rowid = 3`, async function() {

					let promise = await db.get('test1', {rowid:3})
					expect(promise).be.an('array')
					//dir(promise)
					expect(promise.length).be.equals(1)
					expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])
					expect(promise[0].a).to.equal('3')

				})
		  })
			describe(`db.get(table, {rowid:3}, "rowid, *")`, function() {
		    it(`should return one row with rowid=3, and include rowid in col list`, async function() {

					let promise = await db.get('test1', {rowid:3}, "rowid, *")
					expect(promise).be.an('array')
					//dir(promise)
					expect(promise.length).equal(1)
					expect(promise[0]).to.be.an('object').that.has.keys(['rowid','a','b','c'])
					expect(promise[0].rowid, 'rowid is numeric; other cols text').to.equal(3)

				})
		  })
		})
	})

	describe(`db.cnt() test`, function() {
		before( () => dbInit() )

		describe(`with no filter (count all)`, function() {
			let numfound=0

			it(`get all records from test1, store number found`, async function() {
				let promise = await db.get('test1')
				//log('Results\n',promise)
				expect(promise).be.an('array')
				expect(promise.length).be.above(0)
				expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])
				numfound = promise.length
	    })
	    it(`should count all records in test1`, async function() {
				let promise = await db.cnt('test1')
				//log('Results\n',promise)
				expect(promise).is.a('number')
				expect(promise).equals(numfound)
	    })
    })
		describe(`with filter object`, function() {
	    it(`should return "0"`, async function() {
				let promise = await db.cnt('test1', {rowid:111000})
				//log('Results\n',promise)
				expect(promise).is.a('number')
				expect(promise).equals(0)
	    })
    })
		describe(`with filter string`, function() {
	    it(`should return "1"`, async function() {
				let promise = await db.cnt('test1', 'rowid=1')
				//log('Results\n',promise)
				expect(promise).is.a('number')
				expect(promise).equals(1)
	    })
    })
  })

	describe(`db.set() tests`, function() {
		before( () => dbInit() )

		let lastID = null

		describe(`Insert data with no PrimaryKey`, function() {
	    it(`append one row to test1 table`, async function() {

				let promise = await db.set("test1", {a:6, b:77, c:888})
				expect(promise).is.an('object')
				expect(promise).has.keys(['changes','done','lastID','sql'])
				expect(promise.lastID).is.a('number')
				lastID = promise.lastID
				//log('promise',promise)
			})
			it(`should return new row`, async function() {

				let promise = await db.get('test1', {rowid:lastID})
				//log('Result\n',promise)
				expect(promise).is.an('array')
				expect(promise.length).equals(1)
				expect(promise[0]).to.be.an('object').that.has.keys(['a', 'b', 'c'])
				expect(promise[0].a).equals('6')

	    })
	  })
		describe(`Update data with no PrimaryKey`, function() {
	    it(`ToDo: no updates without primary keys at this point`, async function() {
			})
	  })
		describe(`PrimaryKey tests`, function() {
			describe(`Insert record, PrimaryKey not in object`, function() {
				before( () => { testpkTableInit() })

		    it(`insert data, verify lastID`, async function() {

					let promise = await db.set("testpk", {a:7, b:77, c:777})
					//log('Results:\n', promise)
					expect(promise).is.an('object')
					expect(promise).has.keys(['changes','done','lastID','sql'])
					expect(promise.lastID).is.a('number').above(0)
					lastID = promise.lastID
				})
				it(`should return new row with id === lastID`, async function() {

					let promise = await db.get('testpk', {id:lastID})
					//log('Results:\n', promise)
					expect(promise).be.an('array')
					expect(promise.length).equals(1)
					expect(promise[0]).to.be.an('object').that.has.keys(['id', 'a', 'b', 'c'])
					expect(promise[0].a).equals('7')
					expect(promise[0].id).not.null
					expect(promise[0].id).equals(lastID)
		    })

		  })
			describe(`Update record, PrimaryKey in object`, function() {
				before( () => { testpkTableInit() })

		    it(`update c in new row (id=${lastID})`, async function() {

					let promise = await db.set("testpk", {id:lastID, c:8888}, 'id')
					//log('Results:\n', promise)
					expect(promise).is.an('object')
					expect(promise).has.keys(['changes','done','lastID','sql'])
					expect(promise.lastID).is.a('number').above(0)
					expect(promise.lastID).equals(lastID)
				})
				it(`should return modified row`, async function() {

					let promise = await db.get('testpk', {id:lastID})
					//log('Results:\n', promise)
					expect(promise).be.an('array')
					expect(promise.length).to.equal(1)
					expect(promise[0]).to.be.an('object').that.has.keys(['id', 'a', 'b', 'c'])
					expect(promise[0].id).equals(lastID)
					expect(promise[0].c).equals('8888')
		    })

	  	})

			describe(`Bulk insert test`, function() {
				before( () => { testpkTableInit() })

		    it(`insert data, verify objectLite.lastID is an array`, async function() {

					let promise = await db.set("testpk", [
						{a:9, b:99, c:999},
						{a:8, b:88, c:888},
						{a:6, b:66, c:666}
					])
					//log('promise', promise, db.lastID)
					expect(promise).is.an('object')
					expect(promise).has.keys(['changes','done','lastID','sql'])
					expect(promise.lastID).is.an('array')
					expect(promise.lastID.length).equals(3)
					lastID = promise.lastID
				})
				it(`should return 3 rows with id in lastID[]`, async function() {

					let promise = await db.get('testpk', {id: {in:lastID}}, null, 'a')
					//log('Results:\n', promise)
					expect(promise).is.an('array')
					expect(promise.length).equals(3)
					expect(promise[0]).to.be.an('object').that.has.keys(['id', 'a', 'b', 'c'])
					expect(promise[0].a).equals('6')
					expect(promise[1].a).equals('8')
					expect(promise[2].a).equals('9')
		    })

		  })

			describe(`Bulk update test`, function() {
				before( () => { testpkTableInit() })

		    it(`update data, verify objectLite.lastID is an array`, async function() {

					let promise = await db.set("testpk", [
						{id:1, c:'c'},
						{id:2, c:'cc'},
						{id:3, c:'ccc'}
					], 'id')
					//log('Results:\n', promise, db.lastID)
					expect(promise).is.an('object')
					expect(promise).has.keys(['changes','done','lastID','sql'])
					expect(promise.lastID).is.an('array')
					expect(promise.lastID.length).equals(3)
					lastID = promise.lastID
				})
				it(`should return 3 rows with id in lastID[]`, async function() {

					let promise = await db.get('testpk', {id: {in:lastID}}, null, 'id')
					//log('Results:\n', promise)
					expect(promise).is.an('array')
					expect(promise.length).equals(3)
					expect(promise[0]).to.be.an('object').that.has.keys(['id', 'a', 'b', 'c'])
					expect(promise[0].c).equals('c')
					expect(promise[1].c).equals('cc')
					expect(promise[2].c).equals('ccc')
		    })

		  })
	  })
	})

	describe(`db.del() test`, function() {
		before( () => dbInit() )

		describe(`del() with filter object`, function() {
	    it(`should delete record with rowid=1`, async function() {
				let promise = await db.del('test1', {rowid:1})
				//log('Results\n',promise)
				expect(promise.done).is.true
	    })
			it(`should return no records`, async function() {
				let promise = await db.get('test1', {rowid:1})
				//log('Results\n',promise)
				expect(promise).be.an('array')
				expect(promise.length).equals(0)
	    })
	  })

		describe(`del() with filter/where string`, function() {
	    it(`should delete record with rowid=2`, async function() {
				let promise = await db.del('test1', 'rowid=2')
				//log('Results\n',promise)
				expect(promise.done).is.true
	    })
			it(`should return no records`, async function() {
				let promise = await db.get('test1', {rowid:2})
				//log('Results\n',promise)
				expect(promise).be.an('array')
				expect(promise.length).equals(0)
	    })
	  })
  })

	describe(`db.struc() test`, function() {
		before( () => dbInit() )

    it(`should return test1 structure`, async function() {
			let promise = await db.struc('test1')
			//log('Results\n',promise)
			expect(promise).be.an('array')
			expect(promise.length).be.above(0)
			expect(promise[0]).to.be.an('object').that.has.keys(['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'])
    })

		it(`should return test1 structure in custom object format`, async function() {
			let promise = await db.struc('test1', true)
			//log('Results\n',promise)
			expect(promise).be.an('array')
			expect(promise.length).be.above(0)
			expect(promise[0]).to.be.an('object').that.has.keys(['name', 'type', 'required'])
    })
  })

	after( () => {
		dbClose()
	})
})

function dbInit(){
	if(db.inited) return
	db.init({
		debug:debug,
		//debug:false,
		//defaultIDColumnName:'id',
		fileName:testFile
	})
	if(debug) log('dbInit(): done.')		//, callerGet(2) )
}
function dbClose(){
	if(!db.inited) return
	db.close()
}

function dbFileInit(){
	const testFile = "./test/test3.db"
	if(fs.existsSync(testFile))
		fs.unlinkSync(testFile)		// delete old test files

	if(debug) log('dbFileInit(): done.')
}
async function dbDataInit(){
	dbInit()

	let promise = await db.exists('test1')
	if(promise===false)
		promise = await db.create('test1',{	a:1, b:2, c:3 })
	if(promise.done){
		promise = await db.set('test1', [
		 {a:1, b:11, c:111},
		 {a:2, b:22, c:222},
		 {a:3, b:33, c:333},
		 {a:4, b:44, c:444},
		 {a:5, b:55, c:555},
		])
		if(debug) log('dbDataInit(): done.')
	}
	testpkTableInit()
}
async function testpkTableInit(){
	if(testpkInit) return
	testpkInit = true

	let promise = await db.exists('testpk')
	if(promise === true) return
	if(promise !== false) throw promise

	promise = await db.create('testpk', 'id, a, b, c', 'id')
	if(!promise)
		throw Error(`testpkTableInit() error: ${promise}`)
	if(debug) log('testpkTableInit(): done.')
}

function callerGet(level, errorObj=null) {
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
