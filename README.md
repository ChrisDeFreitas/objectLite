# objectLite

objectLite is a Javascript object database using SQLite to persist data, functions to manipulate object arrays, and an import/export plugin system.

Note, this module in use by a http://hapijs.com web application.  console.js contains functions used by  console and web applications.  Features with no tests or marked ToDo: are not in use; except transfer method tests are disabled because they are implementation specific.


## Features
- full SQLite SQL usage with multiple tables per database file
- simple key/value store via persist method
- SQL table functions: count, create, drop, exists, del, get, replace, set, struc
- can supply an object list, a table name, or a full SQL command to some functions
- replace function designed for importing large datasets; optimized with serialize(), transactions, and statements to speed processing
- objects filtered with SQL Where clause or filter objects similar to TaffyDB
- object list functions ([obj1, ...]): count, get/filter, sort
- compress object list to string using zlib compression and base64 encoding (use for backup)
- decompress a compressed string to a JSON string suitable for JSON.parse()
- import/export provides basic functionality to transfer data between SQLite databases
- all functionality built and tested with MochaJs and ChaiJs


## Usage
- available tests:  
	$ npm run test  
	$ npm run listtest  
	$ npm run misctest  
	$ npm run compresstest
- to use in your own prjoect just copy objectLite.js to your project folder
- see example code in console.js
- see test scripts in package.json and ./test/ folder for detailed examples of all functionality
- examine code in objectLite.js for arguments and comments


## Filtering Objects
- this feature defines an object based syntax to query lists of objects.  
- ToDo: provide an explanation of the object filtering logic
- for now examine:  
		-- objectList.js/opApply() for filter operators applied to lists  
		-- objectList.js/opToWhere() for filter operators converted to SQL Where expressions  
		-- ./test/list-test.js/test db.cntList() for operators tested  
- similar to TaffyDB  
- object list = [ {}, ... ]
- filter list = [ filterObj, ... ]
- filter object = {key:value} || {key: {operator:value} }
- key = a property of an object
- operator = comparison operator defined in opApply() or opToWhere()
- value = string or integer (testing required for array and object values)
- example code:  
 -- db.getList(list, {a:1} )  
 -- db.getList(list, {a:{eq:1} )  
 -- db.getList(list, {a:{like:'%peach%'} )  
 - in table commands, SQL Where expressions can be used in place of a filter object


 ## Why create a new module?
 I have used TaffyDB and json-table-lite, both met different needs.  Over time my needs grew to require a module that combined and expanded on both.  That is what objectLite is for me.  I hope this module is simple to use, flexible, and above all maintainable.

 Also note, realmDB is a very good option if you can manage the license/pricing and complexity.


## ToDo
- fix in decompress():
(node:11212) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues.  Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
- update tests for transfer(); they are currently implementation specific
- add filter operator test for: '!in'
- add filter operator test for: '<'
- add filter operator test for: '<='
- add filter operator test for: '>'
- add filter operator test for: '>='
- document object filter functionality
- document code with NaturalDocs, https://www.naturaldocs.org
- complete set() method to update data with no PrimaryKey (need to allow row matching based on unchanged columns)
- expand import/export functionality to include CSV and JSON files

## Thanks To
https://atom.io  
https://www.chaijs.com  
https://github.com/  
https://github.com/guilala/json-table-lite  
https://mochajs.org  
https://developer.mozilla.org  
https://www.naturaldocs.org  
https://github.com/mapbox/node-sqlite3  
https://github.com/felixge/node-stack-trace  
http://sqlite.org  
http://taffydb.com  


Good Luck!

Chris DeFreitas  
chrisd@europa.com
