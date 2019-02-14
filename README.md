# objectLite

objectLite is a Javascript object database using SQLite to persist data, with functions to manipulate object arrays, and import/export functions.


## Features
- full SQLite SQL usage with multiple tables per database file
- simple key/value store
- SQL table functions: count, create, drop, exists, del, get, replace, set, struc
- can supply object list, table name, or full SQL command to some functions
- replace function designed for large datasets; optimized with serialize(), transactions, and statements to speed processing
- objects filtered with SQL Where clause or filter objects similar to TaffyDB
- object list functions ([obj1, ...]): count, get/filter, sort
- compress object list to string using zlib compression and base64 encoding (use for backup)
- decompress a compressed string to a JSON string suitable for JSON.parse()
- import/export provides basic functionality to transfer data between SQLite databases
- all functionality built and tested with MochaJs and ChaiJs


## Usage
- copy objectLite.js to your project folder
- see example code in console.js
- see test scripts in package.json and ./test/ folder for detailed examples of all functionality
- examine code in objectLite.js for arguments and comments


## Filtering Objects
- ToDo: detail explanation, for now examine:  
		-- objectList.js/opApply() for filter operators applied to lists  
		-- objectList.js/opToWhere() for filter operators converted to SQL Where expressions  
		-- ./test/list-test.js/test db.cntList() for operators tested  
- this feature allows you to limit objects returned using an object syntax similar to TaffyDB, for example:  
 -- db.getList(list, {a:1)  
 -- db.getList(list, {a:{eq:1} )  
 -- db.getList(list, {a:{like:'%peach%'} )  
 - in table commands, SQL Where expressions can be used in place of the filter object


## ToDo
- add filter operator test for: '!in'
- add filter operator test for: '<'
- add filter operator test for: '<='
- add filter operator test for: '>'
- add filter operator test for: '>='
- document object filter functionality
- document code with NaturalDocs, https://www.naturaldocs.org
- complete set() method to update data with no PrimaryKey (need to allow row matching based on unchanged columns)
- expand import/export functionality to include CSV and JSON files

## Why create a new library?
I have used TaffyDB and json-table-lite, both met different needs.  Over time my needs grew to require a library that combined and expanded on both.  That is what objectLite is for me.  I hope I have learned from both codebases and created a library that is simple to use, flexible, and above all maintainable.

Also note, realmDB is a very good option if you can manage the license/pricing and complexity.


## Thanks To
https://atom.io  
https://github.com/guilala/json-table-lite  
https://www.chaijs.com  
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
