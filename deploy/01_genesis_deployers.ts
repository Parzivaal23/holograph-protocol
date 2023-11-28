declare var global: any;
import { BigNumber, Contract, UnsignedTransaction } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DeployFunction, Deployment } from '@holographxyz/hardhat-deploy-holographed/types';
import { LeanHardhatRuntimeEnvironment, Signature, StrictECDSA, hreSplit, txParams } from '../scripts/utils/helpers';

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

  if (!(await holographGenesis.isApprovedDeployer('0x724dBA8429CDBFEA28531aEBE9D54Be73e2c25D1'))) {
    // Prepare transaction
    const txRequest = await holographGenesis.populateTransaction.approveDeployer(
      '0x724dBA8429CDBFEA28531aEBE9D54Be73e2c25D1',
      true
    );

    // Use txParams to automatically handle nonce, gasLimit, and gasPrice
    const txParameters = await txParams({
      hre,
      from: deployer.toString(),
      to: holographGenesis.address,
      data: txRequest.data,
    });

    // Update txRequest with the parameters from txParams
    txRequest.nonce = txParameters.nonce;
    txRequest.gasPrice = txParameters.gasPrice as BigNumber;
    txRequest.gasLimit = txParameters.gasLimit as BigNumber;

    // Remove 'from' field before serialization
    delete txRequest.from;

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
  }
};

export default func;
func.tags = ['GenesisDeployers'];
func.dependencies = [];
