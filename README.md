```javascript
const ipcClient = require('ipcclient');

const myIPC = new ipcClient({ name: 'myIPC' });

setInterval(() => {
    myIPC.send('myIPC topic', { data: 'much data such wow' });
}, 5000);

myIPC.on('message', ({ topic, payload }) => {
    console.log(topic, payload);
});
```