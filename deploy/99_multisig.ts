declare var global: any;
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from '@holographxyz/hardhat-deploy-holographed/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const MULTI_SIG: string = '0x9Fe5beF86e46bb129AeA0ccFe1D6687fE84d9aAF'.toLowerCase();

  const switchToHolograph: string[] = [
    'HolographBridgeProxy',
    'HolographFactoryProxy',
    'HolographInterfaces',
    'HolographOperatorProxy',
    'HolographRegistryProxy',
    'HolographTreasuryProxy',
    'LayerZeroModule',
  ];

  const holograph = await hre.ethers.getContract('Holograph');

  let setHolographAdminTx = await holograph.setAdmin(MULTI_SIG, {
    nonce: await hre.ethers.provider.getTransactionCount(deployer),
  });
  hre.deployments.log(`Changing Holograph Admin tx ${setHolographAdminTx.hash}`);
  await setHolographAdminTx.wait();
  hre.deployments.log('Changed Holograph Admin');

  for (const contractName of switchToHolograph) {
    const contract = await hre.ethers.getContract(contractName);
    let setHolographAsAdminTx = await contract.setAdmin(holograph.address, {
      nonce: await hre.ethers.provider.getTransactionCount(deployer),
    });
    hre.deployments.log(`Changing ${contractName} Admin to Holograph tx ${setHolographAsAdminTx.hash}`);
    await setHolographAsAdminTx.wait();
    hre.deployments.log(`Changed ${contractName} Admin to Holograph`);
  }
};
export default func;
func.tags = ['MultiSig'];
func.dependencies = [
  'HolographGenesis',
  'DeploySources',
  'DeployERC20',
  'DeployERC721',
  'RegisterTemplates',
  'Holographer4verify',
];
