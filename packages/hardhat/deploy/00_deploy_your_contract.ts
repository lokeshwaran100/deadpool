import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "Deadpool" using the deployer account and
 * constructor arguments set to treasury and dexRouter addresses
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployDeadpool: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // For local development, use deployer address as treasury
  // For production, you should use actual treasury and DEX router addresses
  const treasury = deployer;
  const dexRouter = "0x3aE6D8A282D67893e17AA70ebFFb33EE5aa65893"; // This should be replaced with actual DEX router address on live networks

  await deploy("Deadpool", {
    from: deployer,
    // Contract constructor arguments: treasury and dexRouter addresses
    args: [treasury, dexRouter],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const deadpoolContract = await hre.ethers.getContract<Contract>("Deadpool", deployer);
  console.log("🪦 Deadpool contract deployed!");
  console.log("📍 Treasury address:", await deadpoolContract.treasury());
  console.log("🔄 DEX Router address:", await deadpoolContract.dexRouter());
};

export default deployDeadpool;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Deadpool
deployDeadpool.tags = ["Deadpool"];
