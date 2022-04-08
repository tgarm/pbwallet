const ethers = require('ethers')
const validator = require('validator')
const { BscscanProvider } = require('@ethers-ancillary/bsc')

const wcoin_abi = require('./abi/wcoin-abi.json')
const erc20_abi = require('./abi/erc20-abi.json')
const erc721_abi = require('./abi/erc721-abi.json')

const ctr_abis = {
    pbmarket: require('./abi/pbmarket-abi.json'),
    pbpuzzlehash: require('./abi/pbpuzzlehash-abi.json'),
    pbt: require('./abi/pbt-abi.json'),
    pbp: require('./abi/pbp-abi.json'),
    tokenredeem: require('./abi/tokenredeem-abi.json'),
    usdt: erc20_abi,
    wbnb: erc20_abi,
    wxcc: wcoin_abi,
    wxch: wcoin_abi,
    whdd: wcoin_abi,
    router: require('./abi/router-abi.json'),
}

const wcoin_infolist = [
    {
        index: 1,
        name: 'Chia',
        symbol: 'XCH',
        prefix: 'xch',
        bsymbol: 'wXCH',
        ctrname: 'wxch'
    },{
        index: 2,
        name: 'HDDcoin',
        symbol: 'HDD',
        prefix: 'hdd',
        bsymbol: 'wHDD',
        ctrname: 'whdd'
    },{
        index: 3,
        name: 'Chives',
        symbol: 'XCC',
        prefix: 'xcc',
        bsymbol: 'wXCC',
        ctrname: 'wxcc'
    }
]

const bsc = {
    consts: {
        zeroPuzzleHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    }
}

function chain_args(testnet){
    if (testnet) {
        return {
            chainId : "0x61",
            chainName : 'BSC Testnet',
            chainNetName : 'bnbt',
            chainNCSymbol : 'TBNB',

            chainRpcUrl : 'https://data-seed-prebsc-1-s1.binance.org:8545/',
            chainExplorerUrl : 'https://testnet.bscscan.com',
            ctr_addrs: {
                  pbp: '0xCcd003832F889af8B16160313F1390322AE58C2C',
                  pbmarket: '0x65331D0b13EED1bfe60B8dc59d3E999288e3Cd3d',
                  tokenredeem: '0xc339e2E1e3a97e764eD135D913e8330BC13DE15a',
                  wxch: '0xF61BfA36440f468F07ed04374966B8FD0d4eEfeF',
                  wxcc: '0x0B9a236d70F380E4aA06AFA47A38a0Ef8182F21F',
                  whdd: '0xCD2B399704316672Cdf53330B6AD77D846cd618C',
                  pbt: '0x0851A276124163e1a2D51B9A0DC4f8477D1e7f25',
                  pbpuzzlehash: '0x907747966912BA16961e0D5ec4A8AC6E6BC55802',


                  usdt: '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684',     // USDT https://amm.kiemtienonline360.com/
                  wbnb: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',     // WBNB https://amm.kiemtienonline360.com/
                  router: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3'    // PancakeSwap: https://bsc.pancake.kiemtienonline360.com/
            }
        }
    } else {
        return {
            chainId : "0x38",
            chainName : 'BSC Mainnet',
            chainNetName : 'bnb',
            chainNCSymbol : 'BNB',
            chainRpcUrl : 'https://bsc-dataseed.binance.org',
            chainExplorerUrl : 'https://bscscan.com',
            ctr_addrs: {
            }
        }
    }
}

let last_gp = {
    price: ethers.BigNumber.from(0),
    updated: 0
}

async function gas_price(bsc){
    let now = Date.now()
    if(now-last_gp.updated>1000*120){   // 120 seconds timeout for gasprice
        let gp = await bsc.provider.getGasPrice()
        if(gp){
            let mult = 0
            if('BSC_GASPRICE_MULT' in process.env){
                mult = parseInt(process.env.BSC_GASPRICE_MULT)
            }
            if(mult){
                gp = gp.mul(mult).div(10)
            }
            last_gp.price = gp
        }
    }
    return last_gp.price
}

async function switch_network(chain) {
    try {
        await bsc.provider.send('wallet_switchEthereumChain', [{
            chainId: chain.chainId
        }])
    } catch (switchError) {
        const ChainNotExist = 4902
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === ChainNotExist) {
            try {
                await bsc.provider.send(
                    'wallet_addEthereumChain',
                    [{
                        chainId: chain.chainId,
                        chainName: chain.chainName,
                        nativeCurrency: {
                            name: chain.chainNCSymbol,
                            symbol: chain.chainNCSymbol,
                            decimals: 18
                        },
                        rpcUrls: [chain.chainRpcUrl],
                        blockExplorerUrls: [chain.chainExplorerUrl],
                    }])
            } catch (addError) {
                console.log('addError', addrError)

                return addError
            }
        } else {
            console.log('switchError')
            return switchError
        }
    }
    return false
}

async function ensure_network(chain) {
    const network = await bsc.provider.getNetwork()
    bsc.provider.on('network', (newNetwork, oldNetwork) => {
        if (oldNetwork) {
            window.location.reload()
            return false
        }
    })
    if (network.chainId != parseInt(chain.chainId)) {
        const err = await switch_network(chain)
        if (err) return err
    }
    if (network.chainId == parseInt(chain.chainId) && network.name == chain.chainNetName) {
        return false
    }
}

async function makeContracts(bsc, addrs){
    const ctrs = {}
    for(var key in addrs){
        ctrs[key] = new ethers.Contract(addrs[key], ctr_abis[key], bsc.signer)
        for(let i in wcoin_infolist){
            if(wcoin_infolist[i].ctrname == key){
                wcoin_infolist[i].address = addrs[key]
                wcoin_infolist[i].bsymbol = await ctrs[key].symbol()
            }
        }
    }
    return ctrs
}

async function connect_wallet(testnet) {
    if (typeof window.ethereum !== "undefined") {
        bsc.provider = new ethers.providers.Web3Provider(window.ethereum, "any")
        const chain = chain_args(testnet)
        const neterr = await ensure_network(chain)
        if (neterr) throw neterr
        await bsc.provider.send("eth_requestAccounts", [])
        bsc.signer = bsc.provider.getSigner()
        bsc.addr = await bsc.signer.getAddress()
        bsc.chain = chain
        bsc.ctrs = await makeContracts(bsc, chain.ctr_addrs)
        return bsc
    }
    return false
}

class StaticJsonRpcProvider extends ethers.providers.JsonRpcProvider {
    async getNetwork() {
        if (this._network) {
            return await this._network
        }
        return super.getNetwork()
    }
}

async function connect_rpc(testnet, key, url) {
    if(validator.isURL(url)){
        bsc.provider = new StaticJsonRpcProvider(url)
    }else{  // BSCScan API-Key also supported
        const apiKey = url
        let network = 'bsc-mainnet'
        if(testnet) network = 'bsc-testnet'
        bsc.provider = new BscscanProvider(network, apiKey)
    }
    bsc.signer = new ethers.Wallet(key, bsc.provider)
    const chain = chain_args(testnet)
    bsc.chain = chain
    bsc.addr = await bsc.signer.getAddress()
    bsc.ctrs = await makeContracts(bsc, chain.ctr_addrs)
    return bsc
}

function erc20_contract(addr){
    return new ethers.Contract(addr, erc20_abi, bsc.signer)
}

function erc721_contract(addr){
    return new ethers.Contract(addr, erc721_abi, bsc.signer)
}

function wcoin_contract(addr){
    return new ethers.Contract(addr, wcoin_abi, bsc.signer)
}

function wcoin_info(idx, field){
    if(!field){
        field = 'index'
    }
    for(let i in wcoin_infolist){
        if(wcoin_infolist[i][field] == idx){
            return Object.assign({}, wcoin_infolist[i])
        }
    }
    return false
}

function wcoin_list(field){
    if(!field){
        field = 'index'
    }
    const res = []
    for(let i in wcoin_infolist){
        const item = wcoin_infolist[i]
        if(item){
            res.push(item[field])
        }
    }
    return res
}

function get_bsc(){
    return bsc
}

exports.connect = connect_wallet
exports.connect_rpc = connect_rpc
exports.erc20_contract = erc20_contract
exports.erc721_contract = erc721_contract
exports.gas_price = gas_price
exports.get_bsc = get_bsc
exports.wcoin_contract = wcoin_contract
exports.wcoin_info = wcoin_info
exports.wcoin_list = wcoin_list
