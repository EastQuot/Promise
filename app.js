
// debugger;
class Task {
	static defer(fn) {
		setTimeout(fn,0);
		// fn()
	}
	static isTask(value) {
		return value instanceof Task;
	}
	// static complete(value) {
	// 	return new Task(complete => complete(value));
	// }
	// static fail(value) {
	// 	return new Task((complete, fail) => fail(value));
	// }

	constructor(executor) {
		this.state = Task.state.PENDING;
		this.result = null;
		this.reason = null;
		this.onSuccess = [];
		this.onFail = [];

		if (executor) {
			console.log('executor', executor)
			executor(this.complete.bind(this), this.fail.bind(this));
		}
	}

	complete(value) {
		let isTask = Task.isTask(value);

		if(isTask) {
			let task = value;
			task.then(
				value => this.complete(value),
				reason => this.fail(reason)
				);
		} else {
			this.succeed(value);
		}
	}

	succeed(result) {
		if(this.state === Task.state.PENDING){
		this.state = Task.state.SUCCEEDED;
		this.result = result;
		this.onSuccess.forEach(callback => callback(result))
	}
	}
	fail(error) {
		this.state = Task.state.FAILED;
		this.error = error;
		this.onFail.forEach(callback => callback(error));
	}

	done(onSuccess, onFail) {
		console.log('done', this.state)
		Task.defer(()=>{
			if(this.state === Task.state.PENDING) {
				console.log('done pending', this.state)
				this.onSuccess.push(onSuccess);
				this.onFail.push(onFail);
			} else if (this.state === Task.state.SUCCEEDED && typeof onSuccess === 'function') {
				console.log('done succeeded', this.state)
				onSuccess(this.result);
			}
			else if (this.state === Task.state.FAILED && typeof onFail === 'function') onFail(this.reason);
		});
	}

	then(onSuccess, onFail) {
		console.log('then', onSuccess, onFail)
		return new Task((complete, fail) => {
			console.log('complete, fail', complete, fail)
			this.done(
				result => {
					console.log('onSuccess', onSuccess)
					if(typeof onSuccess === 'function') {
						try {
							console.log('result', result)
							complete(onSuccess(result));
						} catch (error) {
							fail(error);
						}
					} else {
						console.log(3)
						complete(result);	
					}
				},
				reason => {
					if(typeof onFail === 'function') {
						try {
							complete(onFail(reason));
						} catch (error) {
							fail(error);
						}
					} else {
						fail(reason);
					}
				});
		});

	}

	catch(onFail) {
		return this.then(null, onFail);
	}

}

Task.state = {
	PENDING :'PENDING',
	SUCCEEDED: 'SECCEEDED',
	FAILED: 'FAILED'
};

const http = {
	get(url) {
		if(!url) throw new Error('URL not found');

		return new Task((complete, fail) => {
			let request = new XMLHttpRequest();
			request.onload = function(){
				if(this.status === 200) {
					try {
						let data = JSON.parse(this.response);
						complete(data)
					}	catch (error) {
						fail(error);
					}
				} else {
					fail(this.statusText);
				}
			};

			request.onerror = function(error){
				fail(error);
			};

			request.open("GET", url);
			request.send();
		});
	}
};

http.get('https://jsonplaceholder.typicode.com/users')
			.then(user => {
				console.log(user, 'первый');
				return http.get('https://jsonplaceholder.typicode.com/users');
			})
			.then(posts => {return console.log(posts,"второй")})
