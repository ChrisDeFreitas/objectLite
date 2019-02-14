/*
test objectLite.js list functions

*/

process.on('uncaughtException', function(err1){
  console.error('Process.uncaughtException event:', err1.toString())
  console.error('Stack trace:', err1)
})
process.on('unhandledRejection', function (reason, promise) {
	console.error('Process.unhandledRejection event:', {reason: reason, promise: promise})
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
describe(`Test objectLite List methods`, function() {

	describe(`test db.getList()`, function() {

		it(`should return rows with id<=2`, function() {
			let result = db.getList(list, {id: {'<=':2}} )
			//log('Result:\n', result)
			expect(result.length).equals(2)
		})
		it(`should return columns id,a,d from rows with id<=2, string format`, function() {
			let result = db.getList(list, {id: {'<=':2}}, 'id,d,a' )
			//log('Result:\n', result)
			expect(result.length).equals(2)
			expect(result[0]).to.have.keys('id','a','d')
		})
		it(`should return columns id,a,d from rows with id<=2, array format`, function() {
			let result = db.getList(list, {id: {'<=':2}}, ['id','a','d'] )
			//log('Result:\n', result)
			expect(result.length).equals(2)
			expect(result[0]).to.have.keys('id','a','d')
		})
		it(`should return null columns (p,q,z) from rows with id<=2`, function() {
			let result = db.getList(list, {id: {'<=':2}}, 'id,p,q,z' )
			//log('Result:\n', result)
			expect(result.length).equals(2)
			expect(result[0]).to.have.keys('id','p','q','z')
		})
		it(`should return rows with id<=4 ordered by id`, function() {
			let result = db.getList(list, {id: {'<':4}}, null, 'id' )
			//log('Result:\n', result)
			expect(result.length).equals(3)
		})
		it(`should return columns (id, a, b) from rows with id=2 or id=4`, function(){
			let result = db.getList(list, [{id: {eq:2}}, {id: {eq:4}}], 'id, a, b' )
			//log('Result:\n', result)
			expect(result.length).equals(2)
		})
	})

	describe(`test db.cntList()`, function() {

		it(`should count all rows`, function() {
			expect(db.cntList(list)).equals(list.length)
		})
		it(`should count rows with a=2`, function() {
			expect(db.cntList(list, {a: {'=':2}} )).equals(1)
		})
		it(`should count rows with a=2 using abbreviated equal: {a:2}`, function() {
			expect(db.cntList(list, {a:2} )).equals(1)
		})
		it(`should count rows with d=[1,2]`, function() {
			expect(db.cntList(list, {d: [1,2]} )).equals(1)
		})
		it(`should count rows with e = {aa:1, bb:2}`, function() {
			expect(db.cntList(list, {e: {'=':{aa:1, bb:2}}} )).equals(1)
		})

		it(`should count rows with a!=2`, function() {
			expect(db.cntList(list, {a: {'!=':2}} )).equals(list.length -1)
		})
		it(`should count rows with a!="a"`, function() {
			expect(db.cntList(list, {a: {'!=':'a'}} )).equals(list.length -1)
		})


		it(`"contains" string test: count rows where c contains "a"`, function() {
			expect(db.cntList(list, {c: {'contains':'a'}} )).equals(1)
		})
		it(`"contains" object test: count rows where e has a property named "aa"`, function() {
			expect(db.cntList(list, {e: {'contains':'aa'}} )).equals(2)
		})
		it(`"contains" array test: count rows where d (an array) contains 2`, function() {
			expect(db.cntList(list, {d: {'contains':2}} )).equals(1)
		})


		it(`"like" '%a' test: count rows where c ends with 'hh'`, function() {
			expect(db.cntList(list, {c: {like:'%hh'}} )).equals(1)
		})
		it(`"like" '%a%' test: count rows where c contains 'g'`, function() {
			expect(db.cntList(list, {c: {like:'%g%'}} )).equals(1)
		})
		it(`"like" 'a%' test: count rows where c begins with 'aa'`, function() {
			expect(db.cntList(list, {c: {like:'aa%'}} )).equals(1)
		})
		it(`"like" 'a' (no wildcards) test: count rows with b == '11'`, function() {
			expect(db.cntList(list, {b: {like:'11'}} )).equals(1)
		})


		it(`"in" string test: count rows with b in 'b, bb, bbb'`, function() {
			expect(db.cntList(list, {b: {'in':'b, bb, bbb'}} )).equals(1)
		})
		it(`"in" array test: count rows with b in ['b', 'bb', 'bbb']`, function() {
			expect(db.cntList(list, {b: {'in':['b', 'bb', 'bbb']}} )).equals(1)
		})
		it(`"in" object test: count rows with b in {b:1, bb:2, bbb:3}`, function() {
			expect(db.cntList(list, {b: {'in':{b:1, bb:2, bbb:3}}} )).equals(1)
		})

		it(`ToDo: add '!in' test`)
		it(`ToDo: add '<' test`)
		it(`ToDo: add '<=' test`)
		it(`ToDo: add '>' test`)
		it(`ToDo: add '>=' test`)


	})


	describe(`test db.sortList()`, function() {

		it(`should sort all rows on c column`, function() {
			//console.log('List', list)
			var list2 = db.sortList(list, 'c')
			//console.log('Results', list2)
			expect(list2.length).equals(list.length)
			expect(list2[0].c).equals(list[0].c)
			assert.isTrue( list2[0].c.toString() < list2[1].c.toString() )
			assert.isTrue(list2[0].c.toString() < list2[list2.length-1].c.toString())
		})

		it(`should sort all rows on c column in descending order`, function() {
			//console.log('List', list)
			var list2 = db.sortList(list, 'c', true)
			//console.log('Results', list2)
			expect(list2.length).equals(list.length)
			expect(list2[0].c).equals(list[0].c)
			assert.isTrue( list2[0].c.toString() > list2[1].c.toString() )
			assert.isTrue(list2[0].c.toString() > list2[list2.length-1].c.toString())
		})
	})
})
