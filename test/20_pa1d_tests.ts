import { expect } from 'chai';
import { ethers } from 'hardhat';

import { PA1D, MockExternalCall, MockExternalCall__factory } from '../typechain-types';
import { generateInitCode } from '../scripts/utils/helpers';
import setup, { PreTest } from './utils';
import {
  HOLOGRAPHER_ALREADY_INITIALIZED_ERROR_MSG,
  PA1D_ONLY_OWNER_ERROR_MSG,
  PAD1_ALREADY_INITIALIZED_ERROR_MSG,
} from './utils/error_constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('PA1D Contract', async function () {
  let pad1d: PA1D;
  let l1: PreTest;
  let mockExternalCall: MockExternalCall;
  let owner: SignerWithAddress;
  let notOwner: SignerWithAddress;

  const createRandomAddress = () => ethers.Wallet.createRandom().address;

  let anyAddress = createRandomAddress();

  before(async function () {
    l1 = await setup();

    owner = l1.deployer;
    notOwner = l1.wallet1;

    pad1d = l1.pa1d.attach(l1.sampleErc721Holographer.address);

    const mockExternalCallFactory = await ethers.getContractFactory<MockExternalCall__factory>('MockExternalCall');
    mockExternalCall = await mockExternalCallFactory.deploy();
    await mockExternalCall.deployed();
  });

  async function testExternalCallToFunction(fnAbi: string, fnName: string, args: any[] = []) {
    const ABI = [fnAbi];
    const iface = new ethers.utils.Interface(ABI);
    const encodedFunctionData = iface.encodeFunctionData(fnName, args);

    await expect(mockExternalCall.connect(notOwner).callExternalFn(pad1d.address, encodedFunctionData)).to.not.be
      .reverted;
  }

  describe('init()', async function () {
    it('should fail if already initialized', async function () {
      const initCode = generateInitCode(['address'], [l1.wallet2.address]);
      await expect(pad1d.connect(owner).init(initCode)).to.be.revertedWith(HOLOGRAPHER_ALREADY_INITIALIZED_ERROR_MSG);
    });
  });

  describe('initPA1D()', () => {
    it('should fail be initialized twice', async function () {
      const initCode = generateInitCode(['address', 'uint256'], [l1.wallet2.address, '100']);

      await expect(pad1d.connect(owner).initPA1D(initCode)).to.be.revertedWith(PAD1_ALREADY_INITIALIZED_ERROR_MSG);
    });
  });

  describe('owner()', async function () {
    it('should return the correct owner address', async function () {
      const ownerAddress = await pad1d.owner();
      expect(ownerAddress).to.equal(owner.address);
    });

    it('should fail when comparing to wrong address', async function () {
      const ownerAddress = await pad1d.owner();
      expect(ownerAddress).to.not.equal(notOwner);
    });

    it('should allow external contract to call fn', async function () {
      await testExternalCallToFunction('function owner() external view returns (address)', 'owner');
    });
  });

  describe('isOwner()', async function () {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner).isOwner).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('isOwner');
    });
  });

  describe('_getDefaultReceiver()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._getDefaultReceiver).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_getDefaultReceiver');
    });
  });

  describe('_setDefaultReceiver()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._setDefaultReceiver).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_setDefaultReceiver');
    });
  });

  describe('_getDefaultBp()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._getDefaultBp).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_getDefaultBp');
    });
  });

  describe('_setDefaultBp()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._setDefaultBp).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_setDefaultBp');
    });
  });

  describe('_getReceiver()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._getReceiver).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_getReceiver');
    });
  });

  describe('_setReceiver()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._setReceiver).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_setReceiver');
    });
  });

  describe('_getBp()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._getBp).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_getBp');
    });
  });

  describe('_setBp()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._setBp).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_setBp');
    });
  });

  describe('_getPayoutAddresses()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._getPayoutAddresses).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_getPayoutAddresses');
    });
  });

  describe('_setPayoutAddresses()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._setPayoutAddresses).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_setPayoutAddresses');
    });
  });

  describe('_getPayoutBps()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._getPayoutBps).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_getPayoutBps');
    });
  });

  describe('_setPayoutBps()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._setPayoutBps).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_setPayoutBps');
    });
  });

  describe('_getTokenAddress()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._getTokenAddress).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_getTokenAddress');
    });
  });

  describe('_setTokenAddress()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._setTokenAddress).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_setTokenAddress');
    });
  });

  describe('_payoutEth()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._payoutEth).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_payoutEth');
    });
  });

  describe('_payoutToken()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._payoutToken).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_payoutToken');
    });
  });

  describe('_payoutTokens()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._payoutTokens).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_payoutTokens');
    });
  });

  describe('_validatePayoutRequestor()', () => {
    it('is private function', async function () {
      //@ts-ignore
      expect(typeof pad1d.connect(owner)._validatePayoutRequestor).to.equal('undefined');
      expect(pad1d.connect(owner)).to.not.have.keys('_validatePayoutRequestor');
    });
  });

  describe('configurePayouts', () => {
    it('should be callable by the owner', async () => {
      const addresses = [owner.address, mockExternalCall.address];
      const bps = [5000, 5000];

      let data = (await pad1d.populateTransaction.configurePayouts(addresses, bps)).data || '';

      const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
      await tx.wait();

      const payoutInfo = await pad1d.getPayoutInfo();

      expect(addresses).deep.equal(payoutInfo.addresses);
      expect(bps).deep.equal(payoutInfo.bps.map((bg) => bg.toNumber()));
    });

    it('should fail if the arguments arrays have different lenghts', async () => {
      const addresses = [anyAddress];
      const bps = [1000, 9000];

      let data = (await pad1d.populateTransaction.configurePayouts(addresses, bps)).data || '';

      await expect(l1.factory.connect(owner).adminCall(pad1d.address, data)).to.be.revertedWith(
        'PA1D: missmatched array lenghts'
      );
    });

    it("should fail if the bps down't equal 10000", async () => {
      const addresses = [anyAddress];
      const bps = [100];

      let data = (await pad1d.populateTransaction.configurePayouts(addresses, bps)).data || '';

      await expect(l1.factory.connect(owner).adminCall(pad1d.address, data)).to.be.revertedWith(
        "PA1D: bps down't equal 10000"
      );
    });

    it('should fail if it is not the owner calling it', async () => {
      await expect(pad1d.connect(notOwner).configurePayouts([createRandomAddress()], [1000])).to.be.revertedWith(
        PA1D_ONLY_OWNER_ERROR_MSG
      );
    });
  });

  describe('getPayoutInfo()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.getPayoutInfo()).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function getPayoutInfo() public view returns (address[] memory addresses, uint256[] memory bps)',
        'getPayoutInfo'
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('getEthPayout()', () => {
    it.skip('the owner should be able to call the fn', async () => {
      //TODO: wait for contract changes, if the contract balance is less than the gasCost it should revert with a error msg
      let data = (await pad1d.populateTransaction.getEthPayout()).data || '';

      const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
      await tx.wait();
    });

    it.skip('A authorized address should be able to call the fn', async () => {
      //TODO: wait for contract changes, if the contract balance is less than the gasCost it should revert with a error msg
      await testExternalCallToFunction('function getEthPayout() public ', 'getEthPayout');
    });

    it('Should fail if sender is not authorized', async () => {
      await expect(pad1d.connect(notOwner).getEthPayout()).to.be.revertedWith('PA1D: sender not authorized');
    });
  });

  describe('getTokenPayout()', () => {
    it.skip('the owner should be able to call the fn', async () => {
      //TODO: wait for contract changes, if the contract balance is less than the gasCost it should revert with a error msg
      let data = (await pad1d.populateTransaction.getTokenPayout(owner.address)).data || '';

      const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
      await tx.wait();
    });

    it.skip('A authorized address should be able to call the fn', async () => {
      //TODO: wait for contract changes, if the contract balance is less than the gasCost it should revert with a error msg
      await testExternalCallToFunction('function getTokenPayout(address tokenAddress) public', 'getTokenPayout', [
        mockExternalCall.address,
      ]);
    });

    it('Should fail if sender is not authorized', async () => {
      await expect(pad1d.connect(notOwner).getEthPayout()).to.be.revertedWith('PA1D: sender not authorized');
    });
  });

  describe('getTokensPayout()', () => {
    it.skip('the owner should be able to call the fn', async () => {
      //TODO: wait for contract changes, if the contract balance is less than the gasCost it should revert with a error msg
      let data = (await pad1d.populateTransaction.getTokensPayout([owner.address])).data || '';

      const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
      await tx.wait();
    });

    it.skip('A authorized address should be able to call the fn', async () => {
      //TODO: wait for contract changes, if the contract balance is less than the gasCost it should revert with a error msg
      await testExternalCallToFunction(
        'function getTokensPayout(address[] memory tokenAddresses) public',
        'getTokensPayout',
        [[mockExternalCall.address]]
      );
    });

    it('Should fail if sender is not authorized', async () => {
      await expect(pad1d.connect(notOwner).getTokenPayout(owner.address)).to.be.revertedWith(
        'PA1D: sender not authorized'
      );
    });
  });

  describe('setRoyalties', () => {
    it('should be callable by the owner', async () => {});

    it('should fail if it is not the owner calling it', async () => {
      await expect(pad1d.connect(notOwner).setRoyalties(1, createRandomAddress(), 1000)).to.be.revertedWith(
        PA1D_ONLY_OWNER_ERROR_MSG
      );
    });
  });

  describe('royaltyInfo()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.royaltyInfo(1, 10)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function royaltyInfo(uint256 tokenId, uint256 value) public view returns (address, uint256)',
        'royaltyInfo',
        [1, 10]
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('getFeeBps()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.getFeeBps(1)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function getFeeBps(uint256 tokenId) public view returns (uint256[] memory)',
        'getFeeBps',
        [1]
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('getFeeRecipients()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.getFeeRecipients(1)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function getFeeRecipients(uint256 tokenId) public view returns (address[] memory)',
        'getFeeRecipients',
        [1]
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('getRoyalties()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.getRoyalties(1)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function getRoyalties(uint256 tokenId) public view returns (address[] memory, uint256[] memory)',
        'getRoyalties',
        [1]
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('getFees()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.getFees(1)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function getFees(uint256 tokenId) public view returns (address[] memory, uint256[] memory)',
        'getFees',
        [1]
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('tokenCreator()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.tokenCreators(0)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function tokenCreators(uint256 tokenId) public view returns (address)',
        'tokenCreators',
        [0]
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('calculateRoyaltyFee()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.calculateRoyaltyFee(createRandomAddress(), 1, 1)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function calculateRoyaltyFee(address, uint256 tokenId, uint256 amount) public view returns (uint256)',
        'calculateRoyaltyFee',
        [createRandomAddress(), 1, 1]
      );
    });

    it('should allow inherited contract to call fn');
  });

  describe('marketContract()', () => {
    it('anyone should be able to call the fn', async () => {
      expect(await pad1d.marketContract()).to.equal(pad1d.address);
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction('function marketContract() public view returns (address)', 'marketContract');
    });

    it('should allow inherited contract to call fn');
  });

  describe('tokenCreators()', () => {
    it('anyone should be able to call the fn', async () => {
      await expect(pad1d.tokenCreators(1)).to.not.be.reverted;
    });

    it('should allow external contract to call fn', async () => {
      await testExternalCallToFunction(
        'function tokenCreators(uint256 tokenId) public view returns (address)',
        'tokenCreators',
        [1]
      );
    });

    it('should allow inherited contract to call fn');
  });

  // describe('bidSharesForToken()', () => {
  //   it('anyone should be able to call the fn', async () => {
  //     await expect(pad1d.bidSharesForToken(0)).to.not.be.reverted;
  //   });

  //   it('should allow external contract to call fn', async () => {
  //     await testExternalCallToFunction(
  //       'function bidSharesForToken(uint256 tokenId) public view returns (((uint256),(uint256),(uint256)) memory bidShares)',
  //       'bidSharesForToken',
  //       [0]
  //     );
  //   });

  //   it('should allow inherited contract to call fn');
  // });

  // describe('getTokenAddress()', () => {
  //   const tokenName = `Sample ERC721 Contract (${l1.network.holographId.toString()})`;

  //   it('anyone should be able to call the fn', async () => {
  //     await expect(pad1d.getTokenAddress(tokenName)).to.not.be.reverted;
  //   });

  //   it('should allow external contract to call fn', async () => {
  //     await testExternalCallToFunction(
  //       'function getTokenAddress(string memory tokenName) public view returns (address)',
  //       'getTokenAddress',
  //       [tokenName]
  //     );
  //   });

  //   it('should allow inherited contract to call fn');
  // });

  describe.only('Royalties Distribution Validation', () => {
    const errorMargin = ethers.utils.parseUnits('2000', 'wei');

    describe('A collection with 1 recipient', async () => {
      const totalRoyalties = ethers.utils.parseEther('1');

      before(async () => {
        const data = (await pad1d.populateTransaction.configurePayouts([owner.address], [10000])).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();
      });

      it('should be able to withdraw all native token balance', async () => {
        await owner.sendTransaction({
          to: pad1d.address,
          value: totalRoyalties,
        });

        const accountBalanceBefore = await ethers.provider.getBalance(owner.address);
        const contractBalanceBefore = await ethers.provider.getBalance(pad1d.address);

        const data = (await pad1d.populateTransaction.getEthPayout()).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();

        const accountBalanceAfter = await ethers.provider.getBalance(owner.address);
        const contractBalanceAfter = await ethers.provider.getBalance(pad1d.address);

        expect(contractBalanceAfter).to.be.lt(contractBalanceBefore);
        expect(accountBalanceAfter).to.be.gt(accountBalanceBefore);
      });

      it('should be able to withdraw balance of an ERC20 token', async () => {
        const ERC20 = await l1.holographErc20.attach(l1.sampleErc20Holographer.address);
        const SAMPLEERC20 = await l1.sampleErc20.attach(l1.sampleErc20Holographer.address);

        await SAMPLEERC20.mint(owner.address, totalRoyalties);
        await ERC20.transfer(pad1d.address, totalRoyalties);

        const contractBalanceBefore = await ERC20.balanceOf(pad1d.address);
        const accountBalanceBefore = await ERC20.balanceOf(owner.address);

        const data = (await pad1d.populateTransaction.getTokenPayout(ERC20.address)).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();

        const accountBalanceAfter = await ERC20.balanceOf(owner.address);
        const contractBalanceAfter = await ERC20.balanceOf(pad1d.address);

        expect(contractBalanceAfter).to.be.lt(contractBalanceBefore);
        expect(accountBalanceAfter).to.be.gt(accountBalanceBefore);
      });
    });

    describe('A collection has 2 recipients with a 60% / 40% split', () => {
      const totalRoyalties = ethers.utils.parseEther('10');

      before(async () => {
        const data =
          (await pad1d.populateTransaction.configurePayouts([anyAddress, notOwner.address], [6000, 4000])).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();
      });

      it('should be able to withdraw all native token balance', async () => {
        await owner.sendTransaction({
          to: pad1d.address,
          value: totalRoyalties,
        });

        const accountABalanceBefore = await ethers.provider.getBalance(anyAddress);
        const accountBBalanceBefore = await ethers.provider.getBalance(notOwner.address);
        const contractBalanceBefore = await ethers.provider.getBalance(pad1d.address);

        const data = (await pad1d.populateTransaction.getEthPayout()).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();

        const accountABalanceAfter = await ethers.provider.getBalance(anyAddress);
        const accountBBalanceAfter = await ethers.provider.getBalance(notOwner.address);
        const contractBalanceAfter = await ethers.provider.getBalance(pad1d.address);

        const sixtyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(60).div(100);
        const fortyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(40).div(100);

        expect(contractBalanceAfter).to.be.lt(contractBalanceBefore);
        expect(Number(accountABalanceAfter)).to.be.approximately(
          Number(sixtyPercentOfRoyalties.add(accountABalanceBefore)),
          Number(errorMargin)
        );
        expect(Number(accountBBalanceAfter)).to.be.approximately(
          Number(fortyPercentOfRoyalties.add(accountBBalanceBefore)),
          Number(errorMargin)
        );
      });

      it('should be able to withdraw balance of an ERC20 token', async () => {
        const ERC20 = await l1.holographErc20.attach(l1.sampleErc20Holographer.address);
        const SAMPLEERC20 = await l1.sampleErc20.attach(l1.sampleErc20Holographer.address);

        await SAMPLEERC20.mint(owner.address, totalRoyalties);
        await ERC20.transfer(pad1d.address, totalRoyalties);

        const contractBalanceBefore = await ERC20.balanceOf(pad1d.address);
        const accountABalanceBefore = await ERC20.balanceOf(anyAddress);
        const accountBBalanceBefore = await ERC20.balanceOf(notOwner.address);

        const data = (await pad1d.populateTransaction.getTokenPayout(ERC20.address)).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();

        const accountABalanceAfter = await ERC20.balanceOf(anyAddress);
        const accountBBalanceAfter = await ERC20.balanceOf(notOwner.address);
        const contractBalanceAfter = await ERC20.balanceOf(pad1d.address);

        const sixtyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(60).div(100);
        const fortyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(40).div(100);

        expect(contractBalanceAfter).to.be.lt(contractBalanceBefore);
        expect(accountABalanceAfter).to.be.equal(accountABalanceBefore.add(sixtyPercentOfRoyalties));
        expect(accountBBalanceAfter).to.be.equal(accountBBalanceBefore.add(fortyPercentOfRoyalties));
      });
    });

    describe('A collection has 3 recipients with a 20 % / 50% / 30% split', () => {
      const totalRoyalties = ethers.utils.parseEther('10');
      const mockAddress = createRandomAddress();

      before(async () => {
        const data =
          (
            await pad1d.populateTransaction.configurePayouts(
              [anyAddress, notOwner.address, mockAddress],
              [2000, 5000, 3000]
            )
          ).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();
      });

      it('should be able to withdraw all native token balance', async () => {
        await owner.sendTransaction({
          to: pad1d.address,
          value: totalRoyalties,
        });

        const accountABalanceBefore = await ethers.provider.getBalance(anyAddress);
        const accountBBalanceBefore = await ethers.provider.getBalance(notOwner.address);
        const accountCBalanceBefore = await ethers.provider.getBalance(mockAddress);
        const contractBalanceBefore = await ethers.provider.getBalance(pad1d.address);

        const data = (await pad1d.populateTransaction.getEthPayout()).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();

        const accountABalanceAfter = await ethers.provider.getBalance(anyAddress);
        const accountBBalanceAfter = await ethers.provider.getBalance(notOwner.address);
        const accountCBalanceAfter = await ethers.provider.getBalance(mockAddress);
        const contractBalanceAfter = await ethers.provider.getBalance(pad1d.address);

        const twentyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(20).div(100);
        const fiftyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(50).div(100);
        const thirtyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(30).div(100);

        expect(contractBalanceAfter).to.be.lt(contractBalanceBefore);
        expect(Number(accountABalanceAfter)).to.be.approximately(
          Number(twentyPercentOfRoyalties.add(accountABalanceBefore)),
          Number(errorMargin)
        );
        expect(Number(accountBBalanceAfter)).to.be.approximately(
          Number(fiftyPercentOfRoyalties.add(accountBBalanceBefore)),
          Number(errorMargin)
        );
        expect(Number(accountCBalanceAfter)).to.be.approximately(
          Number(thirtyPercentOfRoyalties.add(accountCBalanceBefore)),
          Number(errorMargin)
        );
      });
      it('should be able to withdraw balance of an ERC20 token', async () => {
        const ERC20 = await l1.holographErc20.attach(l1.sampleErc20Holographer.address);
        const SAMPLEERC20 = await l1.sampleErc20.attach(l1.sampleErc20Holographer.address);

        await SAMPLEERC20.mint(owner.address, totalRoyalties);
        await ERC20.transfer(pad1d.address, totalRoyalties);

        const contractBalanceBefore = await ERC20.balanceOf(pad1d.address);
        const accountABalanceBefore = await ERC20.balanceOf(anyAddress);
        const accountBBalanceBefore = await ERC20.balanceOf(notOwner.address);
        const accountCBalanceBefore = await ERC20.balanceOf(mockAddress);

        const data = (await pad1d.populateTransaction.getTokenPayout(ERC20.address)).data || '';
        const tx = await l1.factory.connect(owner).adminCall(pad1d.address, data);
        await tx.wait();

        const accountABalanceAfter = await ERC20.balanceOf(anyAddress);
        const accountBBalanceAfter = await ERC20.balanceOf(notOwner.address);
        const accountCBalanceAfter = await ERC20.balanceOf(mockAddress);
        const contractBalanceAfter = await ERC20.balanceOf(pad1d.address);

        const twentyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(20).div(100);
        const fiftyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(50).div(100);
        const thirtyPercentOfRoyalties = contractBalanceBefore.sub(contractBalanceAfter).mul(30).div(100);

        expect(contractBalanceAfter).to.be.lt(contractBalanceBefore);
        expect(accountABalanceAfter).to.be.equal(accountABalanceBefore.add(twentyPercentOfRoyalties));
        expect(accountBBalanceAfter).to.be.equal(accountBBalanceBefore.add(fiftyPercentOfRoyalties));
        expect(accountCBalanceAfter).to.be.equal(accountCBalanceBefore.add(thirtyPercentOfRoyalties));
      });
    });
  });
});
