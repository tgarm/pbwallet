const ethers = require('ethers')
const validator = require('validator')
const { BscscanProvider } = require('@ethers-ancillary/bsc')

const wcoin_abi = require('./abi/wcoin-abi.json')
const wcoin_abi_old = require('./abi/wcoin-abi-old.json')
const erc20_abi = require('./abi/erc20-abi.json')
const erc721_abi = require('./abi/erc721-abi.json')

const ctr_abis = {
    pbmarket: require('./abi/pbmarket-abi.json'),
    pbpuzzlehash: require('./abi/pbpuzzlehash-abi.json'),
    pbt: require('./abi/pbt-abi.json'),
    pbp: require('./abi/pbp-abi.json'),
    tokenredeem: require('./abi/tokenredeem-abi.json'),
    wxcc: wcoin_abi,
    wxch: wcoin_abi_old,
    whdd: wcoin_abi_old,
}

const wcoin_infolist = [
    false,
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
                pbmarket: '0x1A29fA4eC2e2A2e40069223C9f6A3EbBa1A37ADF',
                pbpuzzlehash: '0x175A9d005c4D1818896ECD30E2799320EC4578b1',
                pbp: '0x2ef8eCAD53c1ABaAd45c40747723049330880AC6',
                pbt: '0x5a50aC6948ef41Be763D0e1493AfD5f4000174Cc',
                tokenredeem: '0x535cA3a4eE9B7729aC4759e9aB8C1c2dF5b263bd',
                wxcc: '0xD0b2ca07b3c23AC3719755071f33C0e3aB48c5e4',
                wxch: '0x0713A2E8696D7984c8645D4C0367b18f1184c2DF',
                whdd: '0x3963124C11AB802Af8Bd151F6A91136f5a096a2A'
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

function makeContracts(addrs){
    const ctrs = {}
    for(var key in addrs){
        ctrs[key] = new ethers.Contract(addrs[key], ctr_abis[key], bsc.signer)
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
        console.log("bsc.addr = ", bsc.addr)

        bsc.ctrs = makeContracts(chain.ctr_addrs)
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
    bsc.ctrs = makeContracts(chain.ctr_addrs)
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

function wcoin_info(idx){
    if(wcoin_infolist[idx]){
        return Object.assign({}, wcoin_infolist[idx])
    }
    return false
}

exports.connect = connect_wallet
exports.connect_rpc = connect_rpc
exports.erc20_contract = erc20_contract
exports.erc721_contract = erc721_contract
exports.wcoin_contract = wcoin_contract
exports.wcoin_info = wcoin_info
