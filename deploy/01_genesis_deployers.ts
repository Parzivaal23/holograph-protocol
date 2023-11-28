declare var global: any;
import { BigNumber, Contract, UnsignedTransaction } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DeployFunction, Deployment } from '@holographxyz/hardhat-deploy-holographed/types';
import { LeanHardhatRuntimeEnvironment, Signature, StrictECDSA, hreSplit, txParams } from '../scripts/utils/helpers';
import { SuperColdStorageSigner } from 'super-cold-storage-signer';

import { Client, Constants } from 'gridplus-sdk';
import { question } from 'readline-sync';
import { generateAppSecret } from 'gridplus-sdk/dist/util';
import { DEFAULT_ETH_DERIVATION } from 'gridplus-sdk/dist/constants';

require('dotenv').config();

// TODO: Create env variables for these
const deviceID = process.env.GRIDPLUS_DEVICE_ID ?? '';
const password = 'password'; // The password used for connecting to the device
const appName = 'appName'; // The name of your application

const func: DeployFunction = async function (hre1: HardhatRuntimeEnvironment) {
  let { hre, hre2 } = await hreSplit(hre1, global.__companionNetwork);

  const appSecret = generateAppSecret(deviceID, password, appName);

  const client = new Client({
    name: appName,
    privKey: appSecret, // Use the generated appSecret as the private key
  });

  // Call `connect` to determine if we are already paired
  const isPaired = await client.connect(deviceID);

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

  const deployer = addresses[0];

  // Fetch the contract using the address from Lattice1
  let holographGenesis: Contract = await hre.ethers.getContract('HolographGenesis', deployer.toString());
  console.log(`Using HolohraphGenesis contract at ${holographGenesis.address}`);

  // if (!(await holographGenesis.isApprovedDeployer('0x724dBA8429CDBFEA28531aEBE9D54Be73e2c25D1'))) {
  // Prepare transaction
  const txRequest = await holographGenesis.populateTransaction.approveDeployer(
    '0x724dBA8429CDBFEA28531aEBE9D54Be73e2c25D1',
    true
  );

  // Manually set nonce, gasLimit, and gasPrice
  const nonce = await hre.ethers.provider.getTransactionCount(deployer.toString());

  console.log(nonce);
  const gasPrice = await hre.ethers.provider.getGasPrice();

  console.log(gasPrice);
  const gasEstimate = await hre.ethers.provider.estimateGas(txRequest);

  console.log(gasEstimate);

  // Update txRequest with these values
  txRequest.nonce = nonce;
  txRequest.gasPrice = BigNumber.from('2000000000');
  txRequest.gasLimit = BigNumber.from('1000000');

  // Remove 'from' field before serialization
  delete txRequest.from;

  // const params = await txParams({
  //   hre,
  //   from: deployer.toString(),
  //   to: holographGenesis,
  //   data: holographGenesis.populateTransaction.approveDeployer('0x724dBA8429CDBFEA28531aEBE9D54Be73e2c25D1', true),
  // });

  // const txRequest = {
  //   nonce: params.nonce,
  //   gasPrice: params.gasPrice,
  //   gasLimit: params.gasLimit,
  // } as UnsignedTransaction;

  // Serialize the transaction
  const serializedTx = hre.ethers.utils.serializeTransaction(txRequest);

  // Prepare the signing request for Lattice1
  const req = {
    data: {
      signerPath: DEFAULT_ETH_DERIVATION,
      curveType: Constants.SIGNING.CURVES.SECP256K1,
      hashType: Constants.SIGNING.HASHES.KECCAK256,
      encodingType: Constants.SIGNING.ENCODINGS.EVM,
      payload: serializedTx, // Serialized transaction data
    },
  };

  console.log('Serialized Transaction:', serializedTx);
  console.log('Signing Request:', req);

  // Request Lattice1 to sign the transaction
  const signature = await client.sign(req);

  console.log(signature.sig);
  const r = `0x${signature.sig.r.toString('hex')}`;
  const s = `0x${signature.sig.s.toString('hex')}`;
  const v = `0x${signature.sig.v.toString('hex')}`;

  // Combine r, s, and v into one signature string
  const combinedSignature = `${r}${s.slice(2)}${v.slice(2)}`;

  // Combine the serialized transaction with the signature
  const signedTx = hre.ethers.utils.serializeTransaction(txRequest, combinedSignature);

  console.log(`Signed Transaction: ${signedTx}`);

  // Send the signed transaction
  const txResponse = await hre.ethers.provider.sendTransaction(signedTx);

  console.log(txResponse);
  const receipt = await txResponse.wait();

  console.log(receipt);
  // }

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
