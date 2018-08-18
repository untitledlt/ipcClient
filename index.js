const EventEmitter = require('events');
const ipc = require('node-ipc');


class ipcClient extends EventEmitter {
    constructor({name}) {
        super();
        if (!name) {
            throw 'No client name provided!';
        }
        console.info(`Creating ipc client with ID ${name}`);
        this.name = name;
        this.promises = [];
        ipc.config.id = name;
        ipc.config.silent = true;
        this._connect();
    }

    _connect() {
        ipc.connectTo(
            'master',
            () => {
                ipc.of.master.on(this.name, this._onMessage.bind(this));
            }
        );
    }

    _onMessage(data) {
        const {payload = {}} = data;
        const {requestId} = payload;

        if (requestId) {
            this._resolvePromise({requestId, data});

        } else {
            this.emit('message', data);
        }
    }

    _resolvePromise({requestId, data}) {
        const promiseObject = this.promises.find(item => item.requestId === requestId);
        if (promiseObject) {
            this._removePromise(promiseObject)
            clearTimeout(promiseObject.rejectTimer);
            promiseObject.resolve(data);
        }
    }

    _removePromise(ref) {
        const index = this.promises.indexOf(ref);
        if (index !== -1) {
            this.promises.splice(index, 1);
        }
    }

    addPromise({requestId, resolve, reject, timeout = 2000}) {
        let promiseObject;
        promiseObject = {
            requestId,
            resolve,
            rejectTimer: setTimeout(() => {
                this._removePromise(promiseObject);
            }, timeout)
        };

        this.promises.push(promiseObject);
    }

    send(topic = '', payload) {
        if (typeof ipc.of.master !== 'undefined') {
            ipc.of.master.emit(
                this.name,
                {topic, payload}
            )
        } else {
            console.error('Connection not ready yet!');
        }
    }
}

module.exports = ipcClient;
