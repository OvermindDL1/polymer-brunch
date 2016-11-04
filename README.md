# polymer-brunch

Adds Polymers vulcanize and cripser support to [brunch](http://brunch.io).

# Usage

Install the plugin via npm with `npm install --save polymer-brunch`.

Or, do manual install:

- Add `"polymer-brunch": "~x.y.z"` to `package.json` of your brunch app.
- If you want to use git version of plugin, use the GitHub URI `"polymer-brunch": "overminddl1/polymer-brunch"`.

A sample `brunch-config.js` plugin section with defaults and comments:

```javascript
  plugins: {
    polymer: {
      vulcanize: { // A top-level vulcanize is the 'default' path for files that do not match any in 'paths'.
        options: { // These are normal vulcanize options passed as-is.
          abspath: "web/static",
          stripComments: true
        }
      },
      crisper: {  // A top-level crisper is the 'default' path for files that do not match any in 'paths'
        disabled: false, // If true then the vulcanized file is not split.
        options: {}, // These are normal crisper options passed as-is.
      },
      paths: {
        // The key is matched to the end of the path, if this file in the key
        // is being compiled now then the global culvanize and crisper are not
        // not used at all.  This can also be a regex matcher.
        "somefile.polymer" : {
          vulcanize: {} // Specifies vulcanize's options, the global version is unused
          // If one is undefined, like crisper here, then it has no settings
          // used, not even the global will be used, this is fully distinct.
        }
      }
      copyPathsToPublic: { // A set of paths to copy.
        paths: {
          "webcomponents/_polymer": [ // Place in 'public' to copy to
            "web/static/webcomponents/_polymer"
            // List of files to copy from, if this is a directory then copy all
            // the files in the directory, not the directory itself.
          ]
        },
        // verbosity: If 0 then no logging, if 1 then single line summary, if 2
        // then summary per directory recursed into, if 3 then each and every
        // file that is copied is printed.
        verbosity: 1,
        // onlyChanged: If true then compares timestamps before copying, this is
        // only useful when 'watch' is used, it will always copy files
        // regardless when just doing a normal build.
        onlyChanged: true
      }
    }
  }
```

# License

The MIT License (MIT)

Copyright (c) 2016 Paul Miller (<http://paulmillr.com>)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
