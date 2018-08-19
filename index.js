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

    _onMessage({ requestId, payload }) {
        if (requestId) {
            this._resolvePromise({ requestId, payload });

        } else {
            this.emit('message', payload);
        }
    }

    _resolvePromise({ requestId, payload }) {
        const promiseObject = this.promises.find(item => item.requestId === requestId);
        if (promiseObject) {
            this._removePromise(promiseObject)
            clearTimeout(promiseObject.rejectTimer);
            promiseObject.resolve(payload);
        }
    }

    _removePromise(ref) {
        const index = this.promises.indexOf(ref);
        if (index !== -1) {
            this.promises.splice(index, 1);
        }
    }

    request({ topic, payload, timeout = 2000 }) {
        if (!(payload instanceof Object)) {
            throw 'Payload not an object';
        }

        const requestId = Date.now() + Math.random();
        const promiseObject = { requestId };

        const rejectTimer = setTimeout(() => {
            promiseObject.reject({ success: false, reason: 'timeout' });
            this._removePromise(promiseObject);
        }, timeout);

        const promise = new Promise((resolve, reject) => {
            promiseObject.resolve = resolve;
            promiseObject.reject = reject;
        });

        this.promises.push(promiseObject);
        this.send({ topic, payload, requestId });
        return promise;
    }

    send({ topic = '', payload, requestId }) {
        if (typeof ipc.of.master !== 'undefined') {
            ipc.of.master.emit(
                this.name,
                {topic, payload, requestId}
            )
        } else {
            console.error('Connection not ready yet!');
        }
    }
}

module.exports = ipcClient;
