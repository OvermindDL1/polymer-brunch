// From https://github.com/cmelgarejo/copycat-brunch and slightly altered to fix logging explosion even with verbose = false

const mkdirp = require('./mkdirp');
const copyFile = require('./quickly-copy-file');

const path = require('path');
const fs = require('fs');

var mtimes = {};

var cat = (function(){
  var _0777 = parseInt('0777', 8),
    firstRun = true,
    copiedFiles = [],
    verbosity = 1,
    onlyChanged = false,
    notModifiedCount = 0;
  return {
    setVerbosity: function(v) {
      verbosity = v;
    },
    setOnlyChanged: function(c) {
      onlyChanged = c;
    },
    mkdir: function(target){
      var _return = true;
      mkdirp(target, this._0777, function (err) {
          if (err) _return = false;
      });
      return _return;
    },
    copyFolderRecursiveAsync: function(source, target){
      notModifiedCount = 0;
      copiedFiles = [];
      this._copyFolderRecursiveAsync(source, target);
      if(verbosity >= 1){
        const notModifiedMsg = (onlyChanged && !firstRun) ? ' (' + notModifiedCount + ' files were not modified)' : '';
        console.log('[polymer] copied ' + copiedFiles.length + ' files' + notModifiedMsg);
      }
      firstRun = false;
    },
    _copyFolderRecursiveAsync: function(source, target){
      if (!fs.existsSync(target))
        this.mkdir(target);

      var stat = fs.lstatSync(source);

      if (stat.isDirectory()){
        files = fs.readdirSync(source);
        files.forEach(function (file) {
          var curSource = path.join(source, file);

          stat = fs.lstatSync(curSource);

          if (stat.isDirectory()){
            var curTarget = path.join(target, path.basename(curSource));
            cat._copyFolderRecursiveAsync(curSource, curTarget);
          }else{
            cat.copyFileAsync(curSource, target, stat);
          }
        });
      }else{
        this.copyFileAsync(source, target, stat);
      }

      if(verbosity >= 2){
        const notModifiedMsg = (onlyChanged && !firstRun) ? ' (' + notModifiedCount + ' files were not modified so far)' : '';
        console.log('[polymer] copied ' + copiedFiles.length + ' files so far' + notModifiedMsg);
      }
    },
    copyFileAsync: function(original, copy, stat){
      if (onlyChanged) {
        if ((mtimes[original] || 0) >= stat.mtime.getTime()) {
          notModifiedCount += 1;
          return;
        }

        mtimes[original] = stat.mtime.getTime();
      }

      _copyFile = path.join(copy, path.basename(original));
      copiedFiles.push(_copyFile);
      copyFile(original, _copyFile, function(error) {
        if (error)
          console.error(error);
        else{
          if(verbosity >= 3){
            verbosity = false; //just print the current file, or else the recursion makes it print the whole collection
            copiedFiles.forEach(function(file){
              console.log('[polymer] copied ' + file);
            });
          }
          copiedFiles.pop(_copyFile);
        }
      });
    }
  }
})();

module.exports = cat;
