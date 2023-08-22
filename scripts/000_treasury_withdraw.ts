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

  const currentNetworkType: NetworkType = network.type;

  if (currentNetworkType == NetworkType.testnet || currentNetworkType == NetworkType.local) {
    // if (environment != Environment.mainnet && environment != Environment.testnet) {
    const treasuryProxy = await hre.ethers.getContract('HolographTreasuryProxy', deployer);
    const treasury = (await hre.ethers.getContractAt('HolographTreasury', treasuryProxy.address, deployer)) as Contract;

    const tx = await MultisigAwareTx(
      hre as any,
      deployer,
      'HolographTreasury',
      treasury,
      await treasury.populateTransaction.withdraw()
    );

    hre.deployments.log(tx);

    const dryRun = process.env.DRY_RUN;
    if (dryRun && dryRun === 'true') {
      process.exit();
    }

    const receipt = await tx.wait();
    hre.deployments.log('Withdrew funds from the Treasury contract');
    hre.deployments.log(`Transfer tx hash: ${receipt.transactionHash}`);
  }
};

export default func;
func.tags = ['TreasuryWithdraw'];
func.dependencies = [];
