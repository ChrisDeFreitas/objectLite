const log = console.log
			//, err = console.error

var ﻿ui = {
	updateDate:'20190213',
	args:null, 				//read commmandline with grinder.js
	settings:null,		//from settings.ini
	var:{	//store dynamic vars here
		appfolder:null,
		rootfolder:null
	}
}
module.exports = ui

ui.calc = {
	bytesToStr:function(bytes){
		if(bytes < 1024) return bytes+'B'
		if(bytes < (1024 *1024)) return (Math.round(bytes /1024*100) /100)+'KB'
		if(bytes < (1024 *1024 *1024)) return (Math.round(bytes /1024/1024*100) /100)+'MB'
		return (Math.round(bytes /1024/1024/1024 *100) /100)+'GB'
	},
  dirlist: function(options = {
		path:null,
		includePath:true,
		includeStat:false
	}){ //get folder contents into array: [ { name:filename, data:[file stat}, ... ]

		if(options.path==null) throw new Error('ui.calc.dirlist() error, path is null.')
		options.path = ui.calc.pathTrailingSlash(options.path)

		const fs = require('fs')
		let list = fs.readdirSync(options.path)

		if(options.includeStat !== true)	{
			if(options.includePath===true){
				for(let ii in list){
					list[ii] = options.path +list[ii]
				}
			}
			return list
		}

		let results = []
		for(let fn of list){
				results.push( ui.calc.stat(fn) )
		}
		return results
  },
  exec: function(command) {
		//console.log('Exec Launching:['+command+']')
		const childexecSync = require('child_process').execSync
			, options = {encoding:'utf8'}
		const results = childexecSync(command, options)
		console.log('Exec results:', results.toString())
		return results.toString().trim()
	},
	folderDel: function(dir_path, fs) {
		/**
		 * Remove directory recursively
		 * @param {string} dir_path
		 * @param fs = require('fs')
		 * @see https://stackoverflow.com/a/42505874/3027390
		 * modified by Chris Jul/2017
		 */
		if(dir_path==null) return
    if (fs.existsSync(dir_path)) {
      fs.readdirSync(dir_path).forEach(function(entry) {
          var entry_path = dir_path+'/'+entry
          if (fs.lstatSync(entry_path).isDirectory()) {
              ui.calc.folderDel(entry_path, fs)
          } else {
              fs.unlinkSync(entry_path)
          }
      });
      fs.rmdirSync(dir_path);
    }
	},
	msecToStr:function(msec){
       if(msec < 1000) return msec+'ms'
       if(msec < (1000 *60)) return (Math.round(msec /1000*100) /100)+'s'
       if(msec < (1024 *60 *60)) return (Math.round(msec /1000/60*100) /100)+'m'
       return (Math.round(msec /1000/60/60 *100) /100)+'h'
  },
	padNumber: function(value, maxLength) {
		if(maxLength==null) maxLength=2
		if(typeof value != 'string')
			value=value.toString()
		var padlen = maxLength - value.length
	  if(padlen > 0)
      value = '0'.repeat(padlen) +value
     return value
	},
	pathTrailingSlash(str){	//verifies path ends in a trailing slash
		str = str.trim()
		if(str[str.length-1]!='/' && str[str.length-1]!='\\')
			str += '/'
		return str
	},
	pathTrailingSlashDel(str){	//remove trailing slash
		str = str.trim()
		if(str[str.length-1]=='/' || str[str.length-1]=='\\')
			str = str.substr(0, str.length-1)
		return str
	},
	pathSlashFix(str){
		return str.replace(/\\/g,'/')
	},
	stat: function(apath, quiet) {
		if (quiet==null) quiet===true

		var result = null
		const fs = require('fs')
					, Mode = require('stat-mode')
		try {
			//use lstat to return link info
			let stat = fs.lstatSync(apath)
				,mode = new Mode(stat)
			result = {
				//nm:path.basename(apath),
				path:apath,
				bytes:stat.size,
				mode:mode.toString(),
				isDirectory:stat.isDirectory(),
				isLink:stat.isSymbolicLink(),
				uid:stat.uid,
				gid:stat.gid,
				//atime: Date.parse(stat.atime), 	//Changed by the mknod(2), utimes(2), and read(2) system calls.
				atime:stat.atime, 	//Changed by the mknod(2), utimes(2), and read(2) system calls.
				btime:stat.btime, 	//Set at creation; where birthtime is not available, either ctime or 1970-01-01T00:00Z
				//ctime: Date.parse(stat.ctime), 	//Changed by the chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2), and write(2) system calls
				ctime: stat.ctime, 	//Changed by the chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2), and write(2) system calls
				//mtime: Date.parse(stat.mtime), 	//Changed by the mknod(2), utimes(2), and write(2) system calls.
				mtime: stat.mtime, 	//Changed by the mknod(2), utimes(2), and write(2) system calls.
			}
			//if(quiet===false) console.error('ui.calc.stat(): ', stat)
		}
		catch(e){
			if(quiet===false)
				console.error('ui.calc.stat() error: ', e)
			return null
		}
		return result
	},
	strInc: function(str, _idx){
		/*
			purpose: increment the numeric portion in a str
			first call should be: ui.calc.strInc(str)
		*/
		if(_idx===undefined) {	//find last numeric value, this is the start of algorithm
			_idx=null
			for(var ii=str.length-1; ii>=0; ii--){
				var result = parseInt(str[ii],10)
				if(isNaN(result)===true) continue
				_idx=ii;	break;
			}
			if(_idx===null) return str
		}
		else {
			if(_idx < 0) return str
		}
		var num = parseInt(str[_idx])
		if(isNaN(num)===true) {
			return str	//nothing else to do
		}
		++num
		if(num>9){		//str[_idx] = '0'
			str = str.substr(0,_idx)+'0'+str.substr(_idx+1, str.length)
			return ui.calc.strInc(str, --_idx)
		} else {		//str[_idx] = num
			return str.substr(0,_idx)+num+str.substr(_idx+1, str.length)
		}
	},
	strDec: function(str, _idx){
		/*
			purpose: increment the numeric portion in a str
			first call should be: ui.calc.strInc(str)
		*/
		if(_idx===undefined) {	//find last numeric value, this is the start of algorithm
			_idx=null
			for(var ii=str.length-1; ii>=0; ii--){
				var result = parseInt(str[ii],10)
				if(isNaN(result)===true) continue
				_idx=ii;	break;
			}
			if(_idx===null) return str
		}
		else {
			if(_idx < 0) return str
		}
		var num = parseInt(str[_idx])
		if(isNaN(num)===true) {
			return str	//nothing else to do
		}
		--num
		if(num<0){		//str[_idx] = '9'
			str = str.substr(0,_idx)+'9'+str.substr(_idx+1, str.length)
			return ui.calc.strDec(str, --_idx)
		} else {		//str[_idx] = num
			return str.substr(0,_idx)+num+str.substr(_idx+1, str.length)
		}
	},
	strQuoteStrip: function(str){
		if(str[0]=='"' || str[0]=="'")
			str = str.substr(1,str.length)
		if(str[str.length-1]=='"' || str[str.length-1]=="'")
			str = str.substr(0,str.length-1)
		return str
	},
	strToArray(str){	//str = 'string' || 'string1, string2'  || 'string1,string2'
		if(str==null)	return []
		if(Array.isArray(str)) return str
		if(typeof str != 'string') return [str]

		let arr = null
		if(str.indexOf(', ') >= 0)
			arr = str.split(', ')
		else
		if(str.indexOf(',') >= 0)
			arr = str.split(',')
		else
			arr = [str]

		if(arr[0]=='') arr.splice(0,1)
		if(arr[arr.length-1]=='') arr.splice(arr.length-1,1)

		return arr
	},
	strTrim(str, char){
		if(str[0]==char) str = str.substr(1)
		if(str[str.length-1]==char) str = str.substr(0, str.length-1)
		return str
	},
	timeEnd: function(startms,fmt) {
		//use with ui.calc.timeStart
		var ms = Date.now() - startms
		if(fmt == null) return ms
		return ui.calc.timeFormat(ms, fmt)
	},
	timeFormat: function(ms, format) {
		if(format=='ms') return ms+'ms'
		if(format=='s') return (Math.round(ms/1000*10)/10)+'sec'			//99.9sec
		if(format=='m') return (Math.round(ms/1000/60*10)/10)+'min'		//99.9min
		if(format=='h') return (Math.round(ms/1000/60/60*100)/100)+'hrs'	//99.99hrs
		if(format=='d') return (Math.round(ms/1000/60/60/24*100)/100)+'days'	//99.99days
	},
	timestamp: function(adatetime) {
		var dt =(adatetime==null
					 ? new Date()
					 : new Date(adatetime))
			, str = `${dt.getFullYear()}${ui.calc.padNumber(dt.getMonth()+1, 2)}${ui.calc.padNumber(dt.getDate(),2)}`
						+ `-${ui.calc.padNumber(dt.getHours(), 2)}${ui.calc.padNumber(dt.getMinutes(), 2)}${ui.calc.padNumber(dt.getSeconds(), 2)}`
						+ `-${ui.calc.padNumber(dt.getMilliseconds(), 3)}`
		return str
	},
	timeStart: function() {
		//use with ui.calc.timeEnd
		return Date.now()
	}
}
