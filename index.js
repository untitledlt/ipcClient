const EventEmitter = require('events');
const ipc = require('node-ipc');


class ipcClient extends EventEmitter {
    constructor({ name }) {
        super();
        if (!name) {
            throw 'No client name provided!';
        }
        console.info(`Creating ipc client with ID ${name}`);
        this.name = name;
        ipc.config.id = name;
        ipc.config.silent = true;
        this._connect();
    }

    _connect() {
        ipc.connectTo(
            'master',
            () => {
                ipc.of.master.on(
                    this.name,
                    data => this.emit('message', data)
                );
            }
        );
    }

    send(topic = '', payload) {
        if (typeof ipc.of.master !== 'undefined') {
            ipc.of.master.emit(
                this.name,
                { topic, payload }
            )
        } else {
            console.error('Connection not ready yet!');
        }
    }
}

module.exports = ipcClient;
