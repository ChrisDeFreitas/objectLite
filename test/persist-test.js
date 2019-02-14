/*
  persist-test.js

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

	describe(`db.compress() and db.decompress() tests`, function() {
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
})
