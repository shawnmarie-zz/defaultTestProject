var seleniumStandalone = require('selenium-standalone');
var fs = require('fs');
var kill = require('tree-kill');

let seleniumPid;

module.exports = (function() {
    return {
        start: function() {
            function trySelenium(port, endPort) {
                return new Promise(function(resolve, reject) {
                    seleniumStandalone.start({
                            spawnOptions: {detached: true},
                            seleniumArgs: ['-port', port]
                        },
                        function(err, child) {
                            let output = '';
                            let started = false;
                            let exit = false;

                            child.stderr.on('data', data => {
                                if (exit) return;
                                if (started) return;
                                output += data.toString();

                                if (output.indexOf('Address already in use') !== -1) {
                                    console.log(output);
                                    console.log('Port already in use: ', port);

                                    kill(child.pid);
                                    exit = true;
                                }

                                if (output.indexOf('Selenium Server is up and running') !== -1) {
                                    console.log(output);
                                    started = true;
                                    seleniumPid = child.pid;
                                    fs.writeFileSync(`selenium-${child.pid}.pid`, child.pid, 'utf8');
                                    child.unref();

                                    console.log('Selenium started on port', port);

                                    return resolve(port);
                                    //return resolve({seleniumPid: child.pid, seleniumPort: port});
                                }
                            });
                            child.on('exit', () => {
                                if (started) return;

                                if (port === endPort)
                                    return reject(err);

                                return trySelenium(++port, endPort).then(resolve, reject);
                            });
                        });
                });
            }

            return new Promise(function(resolve, reject) {
                seleniumStandalone.install(function(err) {
                    if (err) return reject(err);

                    return trySelenium(4444 + Math.floor(Math.random() * 1000) + 1, 6000).then(resolve);
                });
            });
        },

        stop: function() {
            console.log('Killing PID:', seleniumPid);

            if (seleniumPid) {
                return new Promise(function(resolve, reject) {
                    kill(seleniumPid, function(err) {
                        if (err) console.log(err);
                        fs.unlinkSync(`selenium-${seleniumPid}.pid`);
                        resolve();
                    });
                });
            }
            console.log('Selenium stopped');
        }
    };
})();