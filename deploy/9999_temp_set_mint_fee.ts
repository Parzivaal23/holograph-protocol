declare var global: any;
import { Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DeployFunction, Deployment } from '@holographxyz/hardhat-deploy-holographed/types';
import { LeanHardhatRuntimeEnvironment, getDeployer, hreSplit, txParams } from '../scripts/utils/helpers';
import path from 'path';

const func: DeployFunction = async function (hre1: HardhatRuntimeEnvironment) {
  console.log(`Starting deploy script: ${path.basename(__filename)} 👇`);
  let { hre, hre2 } = await hreSplit(hre1, global.__companionNetwork);
  const deployer = await getDeployer(hre);
  const deployerAddress = await deployer.signer.getAddress();

  console.log(`Deployer address: ${deployerAddress}`);

  // Get the contract's ABI from the compiled artifacts
  const holographArtifact = await hre.artifacts.readArtifact('Holograph');
  const holograph = new ethers.Contract(
    `0x1Ed99DFE7462763eaF6925271D7Cb2232a61854C`,
    holographArtifact.abi,
    deployer.signer
  );

  // Specify your desired gas price and gas limit
  const gasPrice = ethers.utils.parseUnits('1', 'gwei'); // 10 gwei gas price
  const gasLimit = 1000000; // 1,000,000 gas limit

  const tx = await holograph
    .connect(deployer.signer)
    .adminCall(
      '0xec440e8786C34C9752793e1e00Db39e5E94b6b14',
      '0x33466a6c00000000000000000000000000000000000000000000000000000000000f4240',
      {
        gasPrice: gasPrice,
        gasLimit: gasLimit,
      }
    );

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait(); // Wait for the transaction to be mined
  console.log(`Transaction confirmed {tx.hash}`);
  console.log(`Exiting script: ${__filename} ✅\n`);
};

export default func;
func.tags = ['SetMintFee'];
func.dependencies = [];
