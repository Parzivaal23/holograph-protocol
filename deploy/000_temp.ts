declare var global: any;
import fs from 'fs';
import Web3 from 'web3';
import { BigNumberish, BytesLike, ContractFactory, Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from '@holographxyz/hardhat-deploy-holographed/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  LeanHardhatRuntimeEnvironment,
  Signature,
  hreSplit,
  zeroAddress,
  StrictECDSA,
  generateErc20Config,
  generateInitCode,
  genesisDeriveFutureAddress,
  remove0x,
  txParams,
} from '../scripts/utils/helpers';
import { MultisigAwareTx } from '../scripts/utils/multisig-aware-tx';
import { HolographERC20Event, ConfigureEvents, AllEventsEnabled } from '../scripts/utils/events';
import { NetworkType, Network, networks } from '@holographxyz/networks';
import { SuperColdStorageSigner } from 'super-cold-storage-signer';

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

  global.__txNonce = {};
  global.__txNonce[hre.networkName] = 109;

  const web3 = new Web3();

  const salt = hre.deploymentSalt;

  const network = networks[hre.networkName];

  const holograph = await hre.ethers.getContract('Holograph', deployer);

  global.__holographAddress = holograph.address.toLowerCase();

  hre.deployments.log('holograph', holograph.address, 'global.__holographAddress', global.__holographAddress);

  const registry = (await hre.ethers.getContractAt(
    'HolographRegistry',
    await holograph.getRegistry(),
    deployer
  )) as Contract;

  const error = function (err: string) {
    hre.deployments.log(err);
    process.exit();
  };

  const chainId = '0x' + network.holographId.toString(16).padStart(8, '0');

  let tempHtokenFixContract: Contract | null = await hre.ethers.getContractOrNull('TempHtokenFix');
  let tempHtokenFixDeployment: Deployment | null = null;
  if (tempHtokenFixContract == null) {
    try {
      tempHtokenFixDeployment = await hre.deployments.get('TempHtokenFix');
    } catch (ex: any) {
      // we do nothing
    }
  }
  if (tempHtokenFixContract == null && tempHtokenFixDeployment == null) {
    let tempHtokenFix = await hre.deployments.deploy('TempHtokenFix', {
      ...(await txParams({
        hre,
        from: deployer,
        to: '0x0000000000000000000000000000000000000000',
        gasLimit: await hre.ethers.provider.estimateGas(
          (await hre.ethers.getContractFactory('TempHtokenFix')).getDeployTransaction()
        ),
        nonce: 110,
      })),
      args: [],
      log: true,
      waitConfirmations: 1,
    });
    tempHtokenFixContract = tempHtokenFix;
  }

  const erc20hash = '0x' + web3.utils.asciiToHex('HolographERC20').substring(2).padStart(64, '0');

  const hToken = (await hre.ethers.getContractAt(
    'TempHtokenFix',
    await registry.getHToken(chainId),
    deployer
  )) as Contract;
  const originalErc20Source = await registry.getReservedContractTypeAddress(erc20hash);

  process.stdout.write("\n\n originalErc20Source == " + originalErc20Source + "\n\n");
  // originalErc20Source == 0x8B87DA5c07c274cdA919D906305f09397A6E714B

  const tx1 = await MultisigAwareTx(
    hre,
    deployer,
    await registry.populateTransaction.setContractTypeAddress(erc20hash, tempHtokenFixContract.address, {
      ...(await txParams({
        hre,
        from: deployer,
        to: registry,
        data: registry.populateTransaction.setContractTypeAddress(erc20hash, tempHtokenFixContract.address),
        nonce: 111,
      })),
    })
  );

  const tx2 = await hToken.withdraw({
    ...(await txParams({
      hre,
      from: deployer,
      to: hToken,
      data: hToken.populateTransaction.withdraw(),
      nonce: 112,
    })),
  });

  const tx3 = await MultisigAwareTx(
    hre,
    deployer,
    await registry.populateTransaction.setContractTypeAddress(erc20hash, '0x8B87DA5c07c274cdA919D906305f09397A6E714B', {
      ...(await txParams({
        hre,
        from: deployer,
        to: registry,
        data: registry.populateTransaction.setContractTypeAddress(erc20hash, '0x8B87DA5c07c274cdA919D906305f09397A6E714B'),
        nonce: 113,
      })),
    })
  );

  const tx1result = await tx1.wait();
  const tx2result = await tx2.wait();
  const tx3result = await tx3.wait();

  /*


  const currentNetworkType: NetworkType = network.type;
  let primaryNetwork: Network;
  if (currentNetworkType == NetworkType.local) {
    primaryNetwork = networks.localhost;
  } else if (currentNetworkType == NetworkType.testnet) {
    primaryNetwork = networks.ethereumTestnetGoerli;
  } else if (currentNetworkType == NetworkType.mainnet) {
    primaryNetwork = networks.ethereum;
  } else {
    throw new Error('cannot identity current NetworkType');
  }

  const hTokenDeployer = async function (
    holograph: Contract,
    factory: Contract,
    registry: Contract,
    holographerBytecode: BytesLike,
    network: Network
  ) {
    const chainId = '0x' + network.holographId.toString(16).padStart(8, '0');
    let { erc20Config, erc20ConfigHash, erc20ConfigHashBytes } = await generateErc20Config(
      network,
      deployer.address,
      'hToken',
      network.tokenName + ' (Holographed #' + network.holographId.toString() + ')',
      'h' + network.tokenSymbol,
      network.tokenName + ' (Holographed #' + network.holographId.toString() + ')',
      '1',
      18,
      ConfigureEvents([]),
      generateInitCode(['address', 'uint16'], [deployer.address, 0]),
      salt
    );

    const futureHTokenAddress = hre.ethers.utils.getCreate2Address(
      factory.address,
      erc20ConfigHash,
      hre.ethers.utils.keccak256(holographerBytecode)
    );
    hre.deployments.log('the future "hToken #' + network.holographId.toString() + '" address is', futureHTokenAddress);

    let hTokenDeployedCode: string = await hre.provider.send('eth_getCode', [futureHTokenAddress, 'latest']);
    if (hTokenDeployedCode == '0x' || hTokenDeployedCode == '') {
      hre.deployments.log('need to deploy "hToken #' + network.holographId.toString() + '"');

      const sig = await deployer.signMessage(erc20ConfigHashBytes);
      const signature: Signature = StrictECDSA({
        r: '0x' + sig.substring(2, 66),
        s: '0x' + sig.substring(66, 130),
        v: '0x' + sig.substring(130, 132),
      } as Signature);

      const deployTx = await factory.deployHolographableContract(erc20Config, signature, deployer.address, {
        ...(await txParams({
          hre,
          from: deployer,
          to: factory,
          data: factory.populateTransaction.deployHolographableContract(erc20Config, signature, deployer.address),
        })),
      });
      const deployResult = await deployTx.wait();
      let eventIndex: number = 0;
      let eventFound: boolean = false;
      for (let i = 0, l = deployResult.events.length; i < l; i++) {
        let e = deployResult.events[i];
        if (e.event == 'BridgeableContractDeployed') {
          eventFound = true;
          eventIndex = i;
          break;
        }
      }
      if (!eventFound) {
        throw new Error('BridgeableContractDeployed event not fired');
      }
      let hTokenAddress = deployResult.events[eventIndex].args[0];
      if (hTokenAddress != futureHTokenAddress) {
        throw new Error(
          `Seems like hTokenAddress ${hTokenAddress} and futureHTokenAddress ${futureHTokenAddress} do not match!`
        );
      }
      hre.deployments.log('deployed "hToken #' + network.holographId.toString() + '" at:', hTokenAddress);
    } else {
      hre.deployments.log('reusing "hToken #' + network.holographId.toString() + '" at:', futureHTokenAddress);
    }
    if ((await registry.getHToken(chainId)) != futureHTokenAddress) {
      hre.deployments.log('Updated "Registry" with "hToken #' + network.holographId.toString());
      const setHTokenTx = await MultisigAwareTx(
        hre,
        deployer,
        await registry.populateTransaction.setHToken(chainId, futureHTokenAddress, {
          ...(await txParams({
            hre,
            from: deployer,
            to: registry,
            data: registry.populateTransaction.setHToken(chainId, futureHTokenAddress),
          })),
        })
      );
      await setHTokenTx.wait();
    }
  };

  for (let key of Object.keys(networks)) {
    if (networks[key].active && networks[key].type == currentNetworkType) {
      if (network.holographId == networks[key].holographId || currentNetworkType != NetworkType.local) {
        await hTokenDeployer(holograph, factory, registry, holographerBytecode, networks[key]);
      }
    }
  }
  */
};

export default func;
func.tags = ['TEMP'];
func.dependencies = [];
