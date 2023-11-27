declare var global: any;
import { Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DeployFunction, Deployment } from '@holographxyz/hardhat-deploy-holographed/types';
import { LeanHardhatRuntimeEnvironment, hreSplit, txParams } from '../scripts/utils/helpers';
import { SuperColdStorageSigner } from 'super-cold-storage-signer';

require('dotenv').config();

import { Client, Constants } from 'gridplus-sdk';
import { question } from 'readline-sync';
const deviceID = process.env.GRIDPLUS_DEVICE_ID ?? '';

const func: DeployFunction = async function (hre1: HardhatRuntimeEnvironment) {
  let { hre, hre2 } = await hreSplit(hre1, global.__companionNetwork);

  // Instantiate the `Client` object with a name. Here we will use the
  // default `baseUrl`, i.e. GridPlus routing service.
  const client = new Client({ name: 'Holograph Deployer' });

  // Call `connect` to determine if we are already paired
  const isPaired = await client.connect(deviceID);

  console.log(isPaired);

  if (!isPaired) {
    console.log('Not paired with Lattice1. Please pair now.');
    // If not paired, the secret needs to get sent to `pair`
    const secret = await question('Enter pairing secret: ');
    await client.pair(secret);
  }

  console.log(client);

  // Fetch an Ethereum address from Lattice1
  const addresses = await client.getAddresses({
    startPath: [
      // Derivation path of the first requested address
      0x80000000 + 44,
      0x80000000 + 60,
      0x80000000,
      0,
      0,
    ],
    n: 1,
  });
  const lattice1Address = addresses[0];

  console.log(lattice1Address.toString());

  // Fetch the contract using the address from Lattice1
  let holographGenesis: Contract = await hre.ethers.getContract('HolographGenesis', lattice1Address.toString());

  const provider = hre.ethers.provider;

  if (!(await holographGenesis.isApprovedDeployer('0x724dBA8429CDBFEA28531aEBE9D54Be73e2c25D1'))) {
    // Prepare transaction
    const txRequest = await holographGenesis.populateTransaction.approveDeployer(
      '0x724dBA8429CDBFEA28531aEBE9D54Be73e2c25D1',
      true
    );

    // Manually set nonce, gasLimit, and gasPrice
    const nonce = await hre.ethers.provider.getTransactionCount(lattice1Address.toString());

    console.log(nonce);
    const gasPrice = await hre.ethers.provider.getGasPrice();

    console.log(gasPrice);
    const gasEstimate = await hre.ethers.provider.estimateGas(txRequest);

    console.log(gasEstimate);

    // Add these values to the txRequest
    txRequest.nonce = nonce;
    txRequest.gasPrice = gasPrice;
    txRequest.gasLimit = gasEstimate;

    // Serialize the transaction
    const serializedTx = hre.ethers.utils.serializeTransaction(txRequest);

    // Prepare the signing request for Lattice1
    const req = {
      signerPath: [0x80000000 + 44, 0x80000000 + 60, 0x80000000 + 0, 0, 0],
      curveType: 'secp256k1',
      hashType: 'KECCAK256',
      encodingType: 'EVM', // Assuming GridPlus SDK has a constant for this
      payload: serializedTx, // Serialized transaction data
    };

    // Request Lattice1 to sign the transaction
    const signature = await client.sign(req);

    // Combine the serialized transaction with the signature
    const signedTx = hre.ethers.utils.serializeTransaction(txRequest, signature);

    // Send the signed transaction
    const txResponse = await provider.sendTransaction(signedTx);
    const receipt = await txResponse.wait();

    console.log(receipt);
  }

  // const accounts = await hre.ethers.getSigners();
  // let deployer: SignerWithAddress | SuperColdStorageSigner = accounts[0];
  // if (global.__superColdStorage) {
  //   // address, domain, authorization, ca
  //   const coldStorage = global.__superColdStorage;
  //   deployer = new SuperColdStorageSigner(
  //     coldStorage.address,
  //     'https://' + coldStorage.domain,
  //     coldStorage.authorization,
  //     deployer.provider,
  //     coldStorage.ca
  //   );
  // }
  // let holographGenesis: Contract = await hre.ethers.getContract('HolographGenesis', deployer);
  // if (!(await holographGenesis.isApprovedDeployer('0xa198FA5db682a2A828A90b42D3Cd938DAcc01ADE'))) {
  //   let tx = await holographGenesis.approveDeployer('0xa198FA5db682a2A828A90b42D3Cd938DAcc01ADE', true, {
  //     ...(await txParams({
  //       hre,
  //       from: deployer,
  //       to: holographGenesis,
  //       data: holographGenesis.populateTransaction.approveDeployer('0xa198FA5db682a2A828A90b42D3Cd938DAcc01ADE', true),
  //     })),
  //   });
  //   let receipt = await tx.wait();
  // }
};

export default func;
func.tags = ['GenesisDeployers'];
func.dependencies = [];
