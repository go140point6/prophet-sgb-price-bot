require('dotenv').config() // Load .env file
require('log-timestamp')
//const axios = require('axios')
const ethers = require('ethers')
const { Client, Intents } = require('discord.js')

const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS)

// Create a new client instance
const client = new Client({ intents: myIntents })

const up = "\u2B08"
const down = "\u2B0A"
const mid = "\u22EF"

var guild
var lastPrice
var currentPrice
var arrow
var red
var green
var member

var sgbPrice
var provider = new ethers.providers.JsonRpcProvider(
  "https://sgb.ftso.com.au/ext/bc/C/rpc"
)

const ftsoRegistry = {
  address: "0x6D222fb4544ba230d4b90BA1BfC0A01A94E6cB23",
  abi: [
    {
      type: "function",
      stateMutability: "view",
      outputs: [
        { type: "uint256", name: "_price", internalType: "uint256" },
        { type: "uint256", name: "_timestamp", internalType: "uint256" },
      ],
      name: "getCurrentPrice",
      inputs: [{ type: "string", name: "_symbol", internalType: "string" }],
    },
    {
      type: "function",
      stateMutability: "view",
      outputs: [
        { type: "uint256", name: "_price", internalType: "uint256" },
        { type: "uint256", name: "_timestamp", internalType: "uint256" },
      ],
      name: "getCurrentPrice",
      inputs: [
        { type: "uint256", name: "_assetIndex", internalType: "uint256" },
      ],
    },
  ],
}

// Create FTSO Registry contract instance
const ftsoRegistryContract = new ethers.Contract(
  ftsoRegistry.address,
  ftsoRegistry.abi,
  provider
)

//console.log(ftsoRegistryContract)
  
async function getGuild() {
  guild = client.guilds.cache.get(`${process.env.SERVER_ID}`)
  if(!guild) {
    try {
      guild = await client.guilds.fetch(`${process.env.SERVER_ID}`)
    } catch (error) {
      return console.log(`Error while fetching the guild: `, error)
    }
  }
}

async function findRoles() {
  red = guild.roles.cache.find(role => role.name === 'tickers-red')
  if(!red) {
    try {
      red = await guild.roles.cache.find(role => role.name === 'tickers-red')
    } catch (error) {
      return console.log(`Error while fetching the role: `, error)
    }
  }

  green = guild.roles.cache.find(role => role.name === 'tickers-green')
  if(!green) {
    try {
      green = await guild.roles.cache.find(role => role.name === 'tickers-green')
    } catch (error) {
      return console.log(`Error while fetching the role: `, error)
    }
  }
}

async function getBOT() {
  member = guild.members.cache.get(`${process.env.BOT_ID}`)
  if(!member) {
    try {
      member = await guild.members.cache.get(`${process.env.BOT_ID}`)
    } catch (error) {
        return console.log(`Error while fetching the member: `, error)
      }
  }
}

async function clearRoles() {
  let redRole = member.roles.cache.some(role => role.name === ('tickers-red'))
  if (redRole) {
    try {
      await (member.roles.remove(red))
    } catch (error) {
      console.log('red role still present', error)
    }
  }
  let greenRole = member.roles.cache.some(role => role.name === ('tickers-green'))
  if (greenRole) {
    try {
      await (member.roles.remove(green))
    } catch (error) {
      console.log('green role still present', error)
    }
  }
}
  
async function setRed() {
  let redRole = member.roles.cache.some(role => role.name === ('tickers-red'))
  if (!redRole) {
    try {
      await (member.roles.add(red))
    } catch (error) {
      console.log('RED but red role missing', error)
    }
  }
  let greenRole = member.roles.cache.some(role => role.name === ('tickers-green'))
  if (greenRole) {
    try {
      await (member.roles.remove(green))
    } catch (error) {
      console.log('RED but green role still present', error)
    }
  }
}

async function setGreen() {
  let redRole = member.roles.cache.some(role => role.name === ('tickers-red'))
  if (redRole) {
    try {
      await (member.roles.remove(red))
    } catch (error) {
      console.log('GREEN but red role still present', error)
    }
  }
  let greenRole = member.roles.cache.some(role => role.name === ('tickers-green'))
  if (!greenRole) {
    try {
      await (member.roles.add(green))
    } catch (error) {
      console.log('GREEN but green role missing', error)
    }
  }
}

async function getInitialPrice() {
  let sgbBN = await ftsoRegistryContract["getCurrentPrice(string)"]("SGB")
  let sgb = Number(sgbBN._price) / 10 ** 5;
  console.log(sgb);
  sgbPrice = sgb;

  let ftso = {
    address: "0x73E93D9657E6f32203f900fe1BD81179a5bf6Ce4",
    abi: [
      {
              "inputs": [
                      {
                              "internalType": "uint256",
                              "name": "amountIn",
                              "type": "uint256"
                      },
                      {
                              "internalType": "address[]",
                              "name": "path",
                              "type": "address[]"
                      }
              ],
              "name": "getAmountsOut",
              "outputs": [
                      {
                              "internalType": "uint256[]",
                              "name": "amounts",
                              "type": "uint256[]"
                      }
              ],
              "stateMutability": "view",
              "type": "function"
      }
    ],
  };

  const ftsoContract = new ethers.Contract(ftso.address, ftso.abi, provider)

  //console.log(ftsoContract)

  const WSB_ADDRESS = "0x02f0826ef6ad107cfc861152b32b52fd11bab9ed"
  const wsb = "wsb"
  const PRO_ADDRESS = "0xf810576A68C3731875BDe07404BE815b16fC0B4e"
  const pro = "pro"

  //let sgbBN = await ftsoRegistryContract["getCurrentPrice(string)"]("SGB")
  //let sgb = Number(sgbBN._price) / 10 ** 5;
  console.log(sgbPrice);

  let arryPrice = await ftsoContract.getAmountsOut(
      ethers.utils.parseEther("1"),
      [WSB_ADDRESS, PRO_ADDRESS]
  )

  //console.log(arryPrice[0])
  //console.log(arryPrice[1])

  let wsbSGBPrice = Number(arryPrice[0]._hex) / 10 ** 18
  let proSGBPrice = (Number(arryPrice[1]._hex) / 10 ** 18).toFixed(5)
  let wsbUSDPrice = (sgbPrice / wsbSGBPrice).toFixed(5)
  let proUSDPrice = (sgbPrice / proSGBPrice).toFixed(5)
  console.log(wsb + " USD price is " + wsbUSDPrice)
  console.log(pro + " USD price is " + proUSDPrice)

  clearRoles()
  lastPrice = proUSDPrice || 0
  let symbol = `${process.env.COIN_ID.toUpperCase()}`
  client.user.setPresence({
    activities: [{
    //name: `SGB: ${sgbPrice} per ${symbol}`,
    name: `SGB=${proSGBPrice} ${symbol}`,
    type: `PLAYING`
    }]
  })

  arrow = mid
  client.guilds.cache.find(guild => guild.id === process.env.SERVER_ID).me.setNickname(`${symbol} ${arrow} ${process.env.CURRENCY_SYMBOL}${proUSDPrice}`)
  
  console.log('Initial price to', lastPrice)
  console.log(`SGB: ${sgbPrice} per ${symbol}`)
}
 
async function getPrices() {
  let sgbBN = await ftsoRegistryContract["getCurrentPrice(string)"]("SGB")
  let sgb = Number(sgbBN._price) / 10 ** 5;
  console.log(sgb);
  sgbPrice = sgb;

  let ftso = {
    address: "0x73E93D9657E6f32203f900fe1BD81179a5bf6Ce4",
    abi: [
      {
              "inputs": [
                      {
                              "internalType": "uint256",
                              "name": "amountIn",
                              "type": "uint256"
                      },
                      {
                              "internalType": "address[]",
                              "name": "path",
                              "type": "address[]"
                      }
              ],
              "name": "getAmountsOut",
              "outputs": [
                      {
                              "internalType": "uint256[]",
                              "name": "amounts",
                              "type": "uint256[]"
                      }
              ],
              "stateMutability": "view",
              "type": "function"
      }
    ],
  };

  const ftsoContract = new ethers.Contract(ftso.address, ftso.abi, provider)

  //console.log(ftsoContract)

  const WSB_ADDRESS = "0x02f0826ef6ad107cfc861152b32b52fd11bab9ed"
  const wsb = "wsb"
  const PRO_ADDRESS = "0xf810576A68C3731875BDe07404BE815b16fC0B4e"
  const pro = "pro"

  //let sgbBN = await ftsoRegistryContract["getCurrentPrice(string)"]("SGB")
  //let sgb = Number(sgbBN._price) / 10 ** 5;
  console.log(sgbPrice);

  let arryPrice = await ftsoContract.getAmountsOut(
      ethers.utils.parseEther("1"),
      [WSB_ADDRESS, PRO_ADDRESS]
  )

  //console.log(arryPrice[0])
  //console.log(arryPrice[1])

  let wsbSGBPrice = Number(arryPrice[0]._hex) / 10 ** 18
  let proSGBPrice = (Number(arryPrice[1]._hex) / 10 ** 18).toFixed(5)
  let wsbUSDPrice = (sgbPrice / wsbSGBPrice).toFixed(5)
  let proUSDPrice = (sgbPrice / proSGBPrice).toFixed(5)
  console.log(wsb + " USD price is " + wsbUSDPrice)
  console.log(pro + " USD price is " + proUSDPrice)

  currentPrice = proUSDPrice || 0
  let symbol = `${process.env.COIN_ID.toUpperCase()}`
  client.user.setPresence({
    activities: [{
    //name: `SGB: ${sgbPrice} per ${symbol}`,
    name: `SGB=${proSGBPrice} ${symbol}`,
    type: `PLAYING`
    }]
  })

  if (currentPrice > lastPrice) {
    clearRoles()
    console.log('up')
    arrow = up
    setGreen()
    } else if (currentPrice < lastPrice) {
      clearRoles()
      console.log('down')
      arrow = down
      setRed()
      } else {
        console.log('same')
      }

  client.guilds.cache.find(guild => guild.id === process.env.SERVER_ID).me.setNickname(`${symbol} ${arrow} ${process.env.CURRENCY_SYMBOL}${proUSDPrice}`)

  console.log('Current price to', currentPrice)
  console.log(`SGB: ${sgbPrice} per ${symbol}`)

  lastPrice = currentPrice
}

// Runs when client connects to Discord.
client.on('ready', () => {
  console.log('Logged in as', client.user.tag)
  getGuild()
  getBOT()
  findRoles()
  clearRoles()
  getInitialPrice() // Ping server once on startup
  // Ping the server and set the new status message every x minutes. (Minimum of 1 minute)
  setInterval(getPrices, Math.max(1, process.env.UPDATE_FREQUENCY || 1) * 60 * 1000)
})

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
