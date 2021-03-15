import { toBuffer } from 'ethereumjs-util'

const ethUtil = require('ethereumjs-util')
const Wallet = require('ethereumjs-wallet')

export default class KeyruptiveConnect {

    constructor () {
        this.accounts = []
    }

    static getAccounts (index = 0) {
        return this.accounts[index];
    }

    static async getAccountsCloud () {

        let new_accounts = [];

        window.addEventListener( 'message', function(event) {      

            if(event.data.event_id === 'my_cors_message'){
                new_accounts = event.data.data.v1
            }
        }, false );


        return new Promise( async (resolve) => {
            const child = window.open('http://localhost:3000');
          
            const interval = setInterval(() => {

                if (child.closed) {
                    clearInterval(interval);
                    

                    let res = [];


                    for (let i = 0; i < new_accounts.length ; i++) {

                        let pub = ethUtil.importPublic(Buffer.from(new_accounts[i],"hex"))
                        let w = Wallet.fromPublicKey(pub)
                        let address = w.getAddressString()

                        res.push({address: address, index: i})
                    }
                    this.accounts = res
                    resolve(res)
                    return res;
                }
 
            }, 500);
        })
    }
}