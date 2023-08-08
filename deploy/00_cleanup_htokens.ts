declare var global: any;
import { Contract, BigNumber } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from '@holographxyz/hardhat-deploy-holographed/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  hreSplit,
  genesisDeployHelper,
  genesisDeriveFutureAddress,
  generateErc20Config,
  generateInitCode,
  txParams,
} from '../scripts/utils/helpers';
import { MultisigAwareTx } from '../scripts/utils/multisig-aware-tx';
import { HolographERC20Event, ConfigureEvents } from '../scripts/utils/events';
import { NetworkType, networks } from '@holographxyz/networks';
import { SuperColdStorageSigner } from 'super-cold-storage-signer';
import { Environment, getEnvironment } from '@holographxyz/environment';

const func: DeployFunction = async function (hre1: HardhatRuntimeEnvironment) {
  let { hre, hre2 } = await hreSplit(hre1, global.__companionNetwork);
  const accounts = await hre.ethers.getSigners();
  let deployer: SignerWithAddress | SuperColdStorageSigner = accounts[0];

  if (global.__superColdStorage) {
    // address, domain, authorization, ca
    const coldStorage = global.__superColdStorage;
    deployer = new SuperColdStorageSigner(
      coldStorage.address,
      'https://' + coldStorage.domain,
      coldStorage.authorization,
      deployer.provider,
      coldStorage.ca
    );
  }

  const network = networks[hre.networkName];

  const environment: Environment = getEnvironment();

  const salt = hre.deploymentSalt;

  const holograph = await hre.ethers.getContract('Holograph', deployer);

  const hTokenHolders = {
    '0x99ff5FEBFB3f9abD653864503d26010d98e51bd0': {
      arbitrumOne: [],
      avalanche: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
      binanceSmartChain: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      ethereum: ['0x8406Bd8c3faBD48Fe833d2e95D011ae0CD1AD618', '0xc35210698F3f79859c5250af291CCDc4B5e9B21B'],
      optimism: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      polygon: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
    },
    '0x7692F71caa72985ca81f395c9B1e0CCBd4844595': {
      arbitrumOne: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      avalanche: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
      binanceSmartChain: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      ethereum: ['0x8406Bd8c3faBD48Fe833d2e95D011ae0CD1AD618', '0xc35210698F3f79859c5250af291CCDc4B5e9B21B'],
      optimism: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      polygon: [
        '0xa198fa5db682a2a828a90b42d3cd938dacc01ade',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
      ],
    },
    '0xd583efE799E4012331b1B5527B32Cb970Ca88E05': {
      arbitrumOne: ['0x8406Bd8c3faBD48Fe833d2e95D011ae0CD1AD618', '0xc35210698F3f79859c5250af291CCDc4B5e9B21B'],
      avalanche: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
      binanceSmartChain: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      ethereum: ['0x8406Bd8c3faBD48Fe833d2e95D011ae0CD1AD618'],
      optimism: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      polygon: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
    },
    '0x4B780da80D217f7273C26cc9F5f29E8b6D97225D': {
      arbitrumOne: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      avalanche: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0xa198fa5db682a2a828a90b42d3cd938dacc01ade',
      ],
      binanceSmartChain: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0xa198fa5db682a2a828a90b42d3cd938dacc01ade',
      ],
      ethereum: [],
      optimism: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      polygon: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0xa198fa5db682a2a828a90b42d3cd938dacc01ade',
      ],
    },
    '0xD91dACbC2Eb43C44427b55362741d1F601EbCaD3': {
      arbitrumOne: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      avalanche: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
      binanceSmartChain: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      ethereum: ['0x8406Bd8c3faBD48Fe833d2e95D011ae0CD1AD618', '0xc35210698F3f79859c5250af291CCDc4B5e9B21B'],
      optimism: [],
      polygon: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
    },
    '0xb1a140BC4cfe182BAA7530FD3aDBBA195718FA62': {
      arbitrumOne: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      avalanche: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
      binanceSmartChain: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      ethereum: [
        '0x8406Bd8c3faBD48Fe833d2e95D011ae0CD1AD618',
        '0xc35210698F3f79859c5250af291CCDc4B5e9B21B',
        '0xa198FA5db682a2A828A90b42D3Cd938DAcc01ADE',
      ],
      optimism: ['0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618', '0xc35210698f3f79859c5250af291ccdc4b5e9b21b'],
      polygon: [
        '0x8406bd8c3fabd48fe833d2e95d011ae0cd1ad618',
        '0xc35210698f3f79859c5250af291ccdc4b5e9b21b',
        '0x9fbf6ef40d394afca5451d72a95eafa4ecdc693a',
        '0x86d5136c0e2c3d0df1283ae31173a67e35d91c1d',
        '0x0903e3aec112051ae9d2c307f116df841b5bdb85',
        '0x6386a601bcc7fb5f86f06e5c07b20a006597ebf6',
      ],
    },
  };
  const hTokens: string[] = Object.keys(hTokenHolders);

  const tempHolographERC20: Contract | null = await hre.ethers.getContractOrNull('TempHolographERC20', deployer);
  if (tempHolographERC20 == null) {
    await hre.deployments.deploy('TempHolographERC20', {
      ...(await txParams({
        hre,
        from: deployer,
        to: '0x0000000000000000000000000000000000000000',
        gasLimit: await hre.ethers.provider.estimateGas(
          (await hre.ethers.getContractFactory('TempHolographERC20')).getDeployTransaction()
        ),
      })),
      args: [],
      log: true,
      waitConfirmations: 1,
    });
    hre.deployments.log('Deployed "TempHolographERC20"');
  }

  const tempHolographRegistry: Contract | null = await hre.ethers.getContractOrNull('TempHolographRegistry', deployer);
  if (tempHolographRegistry == null) {
    await hre.deployments.deploy('TempHolographRegistry', {
      ...(await txParams({
        hre,
        from: deployer,
        to: '0x0000000000000000000000000000000000000000',
        gasLimit: await hre.ethers.provider.estimateGas(
          (await hre.ethers.getContractFactory('TempHolographRegistry')).getDeployTransaction()
        ),
      })),
      args: [],
      log: true,
      waitConfirmations: 1,
    });
    hre.deployments.log('Deployed "TempHolographRegistry"');
  }
};

export default func;
func.tags = ['hTokenCleanup'];
func.dependencies = [];
