const ethers = require('ethers')
const ctr_abis = {
    pbmarket: require('./abi/pbmarket-abi.json'),
    pbconnect: require('./abi/pbconnect-abi.json'),
    pbt: require('./abi/pbt-abi.json'),
    pbc: require('./abi/pbc-abi.json'),
    pbx: require('./abi/pbx-abi.json'),
    tokenredeem: require('./abi/tokenredeem-abi.json')
}

const erc20_abi = require('./abi/erc20-abi.json')
const erc721_abi = require('./abi/erc721-abi.json')


const bsc = {}

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
                pbconnect: '0x05146B7187D05658dB0A4641432725b6bc766a88',
                pbx: '0xF38F63a18Dde812658D9bB54272B903413Bd5c62',
                pbc: '0xB9B0Ec85Dd60bcC30ABaAA421D89EDaB792a4367',
                pbt: "0x1dE49f4BfAEFA123238eC620792975f0Ee09F404",
                tokenredeem: '0x3d599a7217226Df25A775d86d12bF33b35f8Faf0'
            }
        }
    } else {
        throw new Error('support testnet only')
        // bnet.chainId = '0x38'
        // bnet.chainName = 'BSC Mainnet'
        // bnet.chainNetName = 'bnb'
        // bnet.chainNCSymbol = 'BNB'
        // bnet.chainRpcUrl = 'https://bsc-dataseed.binance.org'
        // bnet.chainExplorerUrl = 'https://bscscan.com'
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

        bsc.ctrs = {}
        for(var key in chain.ctr_addrs){
            bsc.ctrs[key] = new ethers.Contract(chain.ctr_addrs[key], ctr_abis[key], bsc.signer)
        }
        return bsc
    }
    return false
}

function erc20_contract(addr){
    return new ethers.Contract(addr, erc20_abi, bsc.signer)
}

function erc721_contract(addr){
    return new ethers.Contract(addr, erc721_abi, bsc.signer)
}

exports.connect = connect_wallet
exports.erc20_contract = erc20_contract
exports.erc721_contract = erc721_contract
