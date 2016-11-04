'use strict';

const cat = require('./lib/cat');

const FS = require('fs');
const Path = require('path');
const Vulcanize = require('vulcanize');
const Crisper = require('crisper');
const Analyzer = require('polymer-analyzer/lib/analyzer');
const FSUrlLoader = require('polymer-analyzer/lib/url-loader/fs-url-loader').FSUrlLoader;

// Documentation for Brunch plugins:
// https://github.com/brunch/brunch/blob/master/docs/plugins.md

// Remove everything your plugin doesn't need.
class PolymerBrunchPlugin {
  constructor(config) {
    const self = this;
    this.publicPath = config.paths.public;

    this.config = config && config.plugins && config.plugins.polymer || {};

    this.paths = this.config.paths || {};
    if(this.paths._global === undefined) {
      this.paths._global = {
        vulcanize: this.config.vulcanize,
        crisper: this.config.crisper,
      }
    }

    Object.keys(this.paths).map(function(key, _index) {
      const conf = self.paths[key];
      if(conf.vulcanize === undefined) conf.vulcanize = {}
      if(conf.vulcanize.options === undefined) conf.vulcanize.options = {}
      if(conf.vulcanize.options.abspath === undefined) conf.vulcanize.options.abspath = "";
      if(conf.vulcanize._exec === undefined) conf.vulcanize._exec = new Vulcanize(conf.vulcanize.options)
      conf.vulcanize.process = (filepath, callback) => { conf.vulcanize._exec.process(filepath, callback); }

      if(conf.crisper === undefined) conf.crisper = {}
      if(conf.crisper.options === undefined) conf.crisper.options = {}
      if(conf.crisper.options.htmlOutputPath === undefined) conf.crisper.options.htmlOutputPath = Path.posix.join(self.publicPath, "webcomponents");
      conf.crisper.process = (inlinedHtml) => {
        return Crisper(Object.assign({}, conf.crisper.options, {
          source: inlinedHtml,
          onlySplit: true,
          alwaysWriteScript: true,
        }));
      }
    });

    if(this.config.copyPathsToPublic === undefined) this.config.copyPathsToPublic = {};
    if(this.config.copyPathsToPublic.paths === undefined) this.config.copyPathsToPublic.paths = {};
    if(this.config.copyPathsToPublic.verbosity === undefined) this.config.copyPathsToPublic.verbosity = 1;
    if(this.config.copyPathsToPublic.onlyChanged === undefined) this.config.copyPathsToPublic.onlyChanged = false;
    cat.setVerbosity(this.config.copyPathsToPublic.verbosity);
    cat.setOnlyChanged(this.config.copyPathsToPublic.onlyChanged);

    // this.vulcanize = this.config.vulcanize || {};
    // this.vulcanize.options = this.vulcanize.options || {};
    // if(this.vulcanize.options.abspath === undefined) {
    //   this.vulcanize.options.abspath = "";
    // }
    // this.vulcanize._global = new Vulcanize(this.vulcanize.options);
    //
    // this.crisper = this.config.crisper || {};
    // this.crisper.options = this.crisper.options || {};
    // if(this.crisper.options.htmlOutputPath === undefined) {
    //   this.crisper.options.htmlOutputPath = Path.posix.join(config.paths.public, "webcomponents");
    // }

    // console.log("Polymer Brunch Plugin Loaded 1");
  }

  getFilenameWithNewExt(filename, newExt) {
    const ext = Path.extname(filename);
    return filename.slice(0, -ext.length) + newExt;
  }

  getConfig(filepath) {
    const paths = this.paths;
    for(var key in paths) {
      if(paths.hasOwnProperty(key)) {
        if((key instanceof RegExp && key.test(filepath)) || key.endsWith(filepath)) return paths[key];
      }
    }
    return paths._global;
  }

  // file: File => Promise[Boolean]
  // Called before every compilation. Stops it when the error is returned.
  // Examples: ESLint, JSHint, CSSCheck.
  // lint(file) { return Promise.resolve(true); }

  // file: File => Promise[File]
  // Transforms a file data to different data. Could change the source map etc.
  // Examples: JSX, CoffeeScript, Handlebars, SASS.
  // compile(file) { return Promise.resolve(file); }
  compile({data, path}) {
    const self = this;
    return new Promise((resolve, reject) => {
      const publicPath = self.publicPath;
      const conf = self.getConfig(path);
      const vulcanize = conf.vulcanize;
      const crisper = conf.crisper;
      const abspath = vulcanize.options.abspath;
      const filepath = path.substring(abspath.length);
      const copyTo = vulcanize.options.copyTo;
      if(!path.startsWith(abspath)) {
        console.log("Warning: Skipping, File '" + path + "' is not on the abspath of: " + abspath);
        reject("Warning: Skipping, File '" + path + "' is not on the abspath of: " + abspath);
      }
      else {
        vulcanize.process(filepath, (err, inlinedHtml) => {
          if(err) {
            console.log("Error while compiling", path, "with", err);
            reject(err);
          }
          else {
            if(crisper.disabled) resolve(inlinedHtml);
            else {
              var output = crisper.process(inlinedHtml);
              const filename = self.getFilenameWithNewExt(Path.basename(filepath), '.html');
              FS.writeFile(Path.posix.join(crisper.options.htmlOutputPath, filename), output.html, (e) => {
                if(e) {
                  console.log("Error while splitting", path, "with", e);
                  reject(e);
                }
                else resolve(output.js);
              });
            }
          }
        });
      }
    });
  }

  // file: File => Promise[File]
  // Transforms a static file into different data.
  // Examples: Jade, Mustache Templates
  // compileStatic(file) { return Promise.resolve(file); }
  // compileStatic({data, path}) {
  //   return new Promise((resolve, reject) => {
  //     resolve("")
  //   });
  // }

  // file: File => Promise[Array: Path]
  // Allows Brunch to calculate dependants of the file and re-compile them too.
  // Examples: SASS '@import's, Jade 'include'-s.
  // getDependencies(file) { return Promise.resolve(['dep.js']); }

  // file: File => Promise[File]
  // Usually called to minify or optimize the end-result.
  // Examples: UglifyJS, CSSMin.
  // optimize(file) { return Promise.resolve({data: minify(file.data)}); }

  // files: [File] => null
  // Executed when each compilation is finished.
  // Examples: Hot-reload (send a websocket push).
  // onCompile(files) {}
  onCompile(files) {
    const self = this;
    const copyPathsToPublic = this.config.copyPathsToPublic;
    const paths = copyPathsToPublic.paths;
    for(var key in paths) {
      if(paths.hasOwnProperty(key)) {
        const pathTo = key;
        const pathsFrom = paths[key];
        // TODO:  Change this to support globbing via `require('glob')`
        if(typeof pathTo === 'string') {
          if(typeof pathsFrom === 'string') {
            cat.copyFolderRecursiveAsync(pathsFrom, Path.posix.join(self.publicPath, pathTo));
          }
          else if(typeof pathsFrom === 'object') {
            pathsFrom.forEach((pathFrom) => {
              cat.copyFolderRecursiveAsync(pathFrom, Path.posix.join(self.publicPath, pathTo));
            });
          }
        }
      }
    }
  }

  // Allows to stop web-servers & other long-running entities.
  // Executed before Brunch process is closed.
  // teardown() {}
}

// Required for all Brunch plugins.
PolymerBrunchPlugin.prototype.brunchPlugin = true;

// Required for compilers, linters & optimizers.
// 'javascript', 'stylesheet' or 'template'
PolymerBrunchPlugin.prototype.type = 'template';

// Required for compilers & linters.
// It would filter-out the list of files to operate on.
PolymerBrunchPlugin.prototype.extension = 'polymer';
// PolymerBrunchPlugin.prototype.pattern = /\.js$/;

// PolymerBrunchPlugin.prototype.staticTargetExtension  = 'html';

// Indicates which environment a plugin should be applied to.
// The default value is '*' for usual plugins and
// 'production' for optimizers.
// PolymerBrunchPlugin.prototype.defaultEnv = 'production';
PolymerBrunchPlugin.prototype.defaultEnv = '*';

module.exports = PolymerBrunchPlugin;
