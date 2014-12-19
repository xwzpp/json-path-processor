/*jslint node: true */
'use strict';
var lodash = {};

var jsonpath = function (obj, path, assign, create, del) {
        var P = path ? path.split(/\./).reverse() : [],
            OO = obj ? obj : (create ? {} : null),
            O = obj,
            key;

        if ((OO === null) && !create) {
            return undefined;
        }

        while (P.length) {
            key = P.pop();
            switch (key) {
            case '$':
            case '':
                continue;
            }

            if ((OO[key] !== undefined) && (OO[key] !== null)) {
                OO = OO[key];
            } else {
                if (create !== undefined) {
                    if (P.length) {
                        OO[key] = {};
                    }
                    OO = OO[key];
                } else {
                    return undefined;
                }
            }
            if (P.length === 1) {
                O = OO;
            }
        }

        if (del) {
            delete O[key];
            return OO;
        }

        if (assign) {
            try {
                if (key) {
                    O[key] = assign.call ? assign(OO) : assign;
                } else {
                    O = assign.call ? assign(OO) : assign;
                }
            } catch (E) {
                if (create && key) {
                    if (key) {
                        O[key] = create;
                    }
                }
            }
        }

        return OO;
    };

function JPP (data) {
    this._data = data;
}

JPP.prototype = {
    value: function (path) {
        if (!this._data) { 
            return this._data;
        }
        return path ? jsonpath(this._data, path) : this._data;
    },
    get: function (path) {
        return new JPP(this.value(path));
    },
    set: function (path, value, create, del) {
        if (path && path !== '$') {
            if (create && ((this._data === null) || (typeof this._data !== 'object'))) {
                this._data = {};
            }
            jsonpath(this._data, path, value, create, del);
        } else {
            jsonpath(this, '_data', value, create, del);
        }
        return this;
    },
    copy: function (from, to, skip) {
        return this.set(to, this.value(from), skip ? undefined : null);
    },
    del: function (path) {
        return this.set(path, undefined, false, true);
    },
    move: function (from, to) {
        var V = this.value(from);
        if (V !== undefined) {
            this.set(to, V, true);
            this.del(from);
        }
        return this;
    },
    each: function (path, cb, elsecb) {
        var V = this.value(path);

        if (!V) {
            return this.set(path, elsecb);
        }

        if (Array.isArray(V)) {
            return this.set(path, V.map(function (V, I) {
                var R;
                try {
                    R = cb(V, I);
                    return (R === undefined) ? V : R;
                } catch (E) {
                    return V;
                }
            }));
        }

        return this;
    },
    forIn: function (path, cb, elsecb) {
        lodash_wrap(this._data, 'forIn', path, cb, elsecb);
        return this;
    },
    filter: function (path, cb, elsecb) {
        lodash_wrap(this._data, 'filter', path, cb, elsecb);
        return this;
    },
    find: function (path, cb) {
        return lodash.find(this.value(path), cb, this._data);
    },
    findLast: function (path, cb) {
        return lodash.findLast(this.value(path), cb, this._data);
    },
    range: function (path, a1, a2, a3) {
        this.set(path, lodash.range(a1, a2, a3), []);
        return this;
    },
    concat: function () {
        var all = lodash.map(arguments, this.value, this).reduce(function(O, V) {
            return (V && V.concat) ? O.concat(V) : O;
        }, []);

        if (all.length) {
            this.set(arguments[0], all, true);
        }
        return this; 
    }
};

module.exports = function (data, path) {
    return path ? jsonpath(data, path) : (new JPP(data));
};
