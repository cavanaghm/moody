var debug = require('debug')('dynamoosey');

module.exports = function DynamooseyQuery(model, filter) {
	var dyq = this;
	dyq.dy = model.dy;
	dyq.model = model;

	dyq.query = {
		count: false,
		limit: 0,
		filters: {},
		select: [],
		sort: [],
		flatten: false,
	};


	/**
	* Append query criteria
	* @param {Object} query Query to append
	* @returns {DynamooseQuery} This chainable query
	*/
	dyq.find = query => {
		Object.assign(dyq.query.filters, query);
		return dyq;
	};

	// Populate initial query
	if (filter) dyq.find(filter);


	/**
	* Mark the query as a count - which will only return the number of matches
	* @param {Object} query Optional to append
	* @returns {DynamooseQuery} This chainable query
	*/
	dyq.count = query => {
		dyq.query.count = true;
		return dyq.find(query);
	};


	/**
	* Set the limit of documents
	* If the value is zero, falsy or Infinity the limit is disabled
	* @param {*} limit The limit to set
	* @returns {DynamooseQuery} This chainable query
	*/
	dyq.limit = limit => {
		dyq.query.limit =
			!limit || limit === Infinity ? 0
			: limit;

		return dyq;
	};


	/**
	* Set the fields to return (or "Project" to use proper DB terminology)
	* Fields can be specified in array or CSV form
	* @param {string|array} fields... Fields to return
	* @returns {DynamooseQuery} This chainable query
	*/
	dyq.select = (...fields) => {
		dyq.query.select = Array.from(new Set(
			fields.flatMap(f =>
				(
					_.isString(f) ? f.split(/\s*,\s*/)
					: f
				)
		)));
		console.log('UNTESTED SELECT NOW', dyq.query.select);

		return dyq;
	}


	/**
	* Set that we are only interested in the first match and it should be returned directly as an object rather than an array of matches
	* @returns {DynamooseQuery} This chainable query
	*/
	dyq.one = ()=> {
		dyq.query.limit = 1;
		dyq.query.flatten = true;
		return dyq;
	};


	/**
	* Execute the query and return a promise
	* @returns {Promise <Object|array|undefined>} A promise which returns the found document, collection of documents or undefined
	*/
	dyq.promise = ()=> new Promise((resolve, reject) => {
		debug('Execute query', dyq.query);

		var q = dyq.model.model.scan(dyq.query.filters);
		if (dyq.query.count) q.count();

		q.exec((err, res) => {
			if (err) return reject(err);
			if (dyq.query.count) {
				debug('Counted', res[0], 'docs from query');
				resolve(res[0]);
			} else if (dyq.query.flatten) {
				debug('Returned first match');
				resolve(res[0]);
			} else {
				debug('Found', res.length, 'docs from query');
				resolve(dyq.query.flatten ? res[0] : res);
			}
		});
	});


	/**
	* Return a promise and immediately execute it
	* This is really just an alias for dyq.promise().then(...)
	* @param {*} args... Callback to run
	* @returns {Promise}
	*/
	dyq.then = (...args) => dyq.promise().then(...args);


	/**
	* Return a promise and immediately execute it as a catch
	* This is really just an alias for dyq.promise().catch(...)
	* @param {*} args... Callback to run
	* @returns {Promise}
	*/
	dyq.catch = (...args) => dyq.promise().catch(...args);


	/**
	* Return a promise and immediately execute it as a finally block
	* This is really just an alias for dyq.promise().finally(...)
	* @param {*} args... Callback to run
	* @returns {Promise}
	*/
	dyq.finally = (...args) => dyq.promise().finally(...args);



	return dyq;
};
