import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    intuition: {
      url: process.env.RPC_INTUITION || "https://testnet.rpc.intuition.systems/http:13579",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: Number(process.env.CHAIN_ID) || 13579,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      intuition: process.env.EXPLORER_API_KEY || "placeholder",
    },
    customChains: [
      {
        network: "intuition",
        chainId: Number(process.env.CHAIN_ID) || 13579,
        urls: {
          apiURL: process.env.EXPLORER_API_URL || "",
          browserURL: process.env.EXPLORER_URL || "",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  mocha: {
    timeout: 60000,
  },
};

export default config;
