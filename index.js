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
    presale: require('./abi/presale-abi.json'),
    staking: require('./abi/staking-abi.json'),
    tokenredeem: require('./abi/tokenredeem-abi.json'),
    eth: erc20_abi,
    busd: erc20_abi,
    usdt: erc20_abi,
    wbnb: erc20_abi,
    wxcc: wcoin_abi,
    whdd: wcoin_abi,
    wxch: wcoin_abi,
    factory: require('./abi/factory-abi.json'),
    router: require('./abi/router-abi.json'),
}

const wcoin_infolist = [
    {
        index: 1,
        name: 'Chia',
        symbol: 'XCH',
        prefix: 'xch',
        bsymbol: 'WXCH',
        ctrname: 'wxch'
    },{
        index: 2,
        name: 'HDDcoin',
        symbol: 'HDD',
        prefix: 'hdd',
        bsymbol: 'WHDD',
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

const chain_args = [
    {
        chainId : "0x38",
        chainName : 'BSC Mainnet',
        chainNetName : 'bnb',
        chainNCSymbol : 'BNB',

        chainRpcUrl : 'https://bsc-dataseed.binance.org',
        chainExplorerUrl : 'https://bscscan.com',
        swapUrl: 'https://pancakeswap.finance',
        ctr_addrs: {
            pbp: '0x217634d01809d7B9C6348D70A95AE7f5E5179de3',
            pbmarket: '0xD74AD4a7A6E4beE788aB6D94e7A9eE93Ab701348',
            tokenredeem: '0x36b2Aaaf0D362a774867794f9133a4C956D3B376',
            wxch: '0xEc02B1b904a4e925F67fA8Bc6c5d428266F5C1a5',
            whdd: '0xb558F597076babcC66250714F93A7b869Db26dB5',
            wxcc: '0x1aDCC92C322c21e387e6112bf162858AF208ff3a',
            pbt: '0x0ceaD067be3670Dfa1f35Cc320C96842e70e7AF3',
            pbpuzzlehash: '0x421be00884414f9BfEF3ac89DBF955638e215235',
            presale: '0x091f5A48E8C0CC8f566ba0f0E4e4d40b38212b9E',
            staking: '0xA9904199717f573e3716F55D991a21C342e96F3B',

            // mainnet tokens: router from :https://docs.pancakeswap.finance
            // others from https://bscscan.com token tracker
            eth: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
            busd: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            usdt: '0x55d398326f99059fF775485246999027B3197955',
            wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
            router: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
        }
    },
    {
        chainId : "0x61",
        chainName : 'BSC Testnet',
        chainNetName : 'bnbt',
        chainNCSymbol : 'TBNB',

        chainRpcUrl : 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        chainExplorerUrl : 'https://testnet.bscscan.com',
        swapUrl: 'https://pancake.kiemtienonline360.com/#',
        ctr_addrs: {
            pbp: '0xB8175b05ECC42572dB9F92278fdbb2512208596B',
            pbmarket: '0x9C3E1f43C6438195E4c030B738a20Ff36FB58904',
            presale: '0x520B193E096368dA9eff2BB62E9A79127dcE6D60',
            tokenredeem: '0xabD4D272E73110D6521081d03625db1d75c40A4D',
            wxch: '0xC4839af7868b025207e364D051dA135aacAc3C2A', // NO WHDD on testnet
            wxcc: '0x44137B6d5160F6344D835F04843AbA260303e7ab',
            pbt: '0x760427cDE87aDDe133E1447B7aA9aea0659221C0',
            pbpuzzlehash: '0xE0E916f0B1C9698Fec9Db4C54A6b924eB2dee5A6',
            staking: '0x3A54F062e4ea765741EF968aeD955E7103472C93',

            // tokens from: https://amm.kiemtienonline360.com/
            eth: '0x8babbb98678facc7342735486c851abd7a0d17ca',
            busd: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
            usdt: '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684',
            wbnb: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
            factory: '0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc',
            router: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3'    // PancakeSwap: https://bsc.pancake.kiemtienonline360.com/
        }
    }
]

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

async function ensure_network(chains, autoswitch) {
    const network = await bsc.provider.getNetwork()
    bsc.provider.on('network', (newNetwork, oldNetwork) => {
        if (oldNetwork) {
            window.location.reload()
            return false
        }
    })
    for(let i in chains){
       const chain = chains[i]
       if (network.chainId == parseInt(chain.chainId) && network.name == chain.chainNetName) {
            return chain
        }
    }
    if(autoswitch){
        const chain = chains[0]
        const err = await switch_network(chain)
        if (!err) return chain
    }
    return false
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

async function connect_wallet(instance, mobile) {
    if(!instance){
        if (typeof window.ethereum !== "undefined") {
            instance = window.ethereum
            mobile = false
        }
    }
    if(instance){
        bsc.provider = new ethers.providers.Web3Provider(instance)
        const chain = await ensure_network(chain_args, !mobile)
        if(!chain) return false
        bsc.chain = chain
        if(!mobile){
            await bsc.provider.send("eth_requestAccounts", [])
        }
        bsc.signer = bsc.provider.getSigner()
        bsc.addr = await bsc.signer.getAddress()
        bsc.ctrs = await makeContracts(bsc, chain.ctr_addrs)
        bsc.mobile = mobile
        return bsc
    }
    return false
}

async function disconnect_wallet() {
    if('disconnect' in bsc.provider){
        await bsc.provider.disconnect()
    }
    delete bsc.addr
    delete bsc.provider
    delete bsc.signer
    delete bsc.mobile
    delete bsc.ctrs
    delete bsc.chain
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
    bsc.chain = chain_args[0]
    if(testnet){
        bsc.chain = chain_args[1]
    }
    bsc.addr = await bsc.signer.getAddress()
    bsc.ctrs = await makeContracts(bsc, bsc.chain.ctr_addrs)
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
exports.disconnect = disconnect_wallet
exports.connect_rpc = connect_rpc
exports.erc20_contract = erc20_contract
exports.erc721_contract = erc721_contract
exports.gas_price = gas_price
exports.get_bsc = get_bsc
exports.wcoin_contract = wcoin_contract
exports.wcoin_info = wcoin_info
exports.wcoin_list = wcoin_list
