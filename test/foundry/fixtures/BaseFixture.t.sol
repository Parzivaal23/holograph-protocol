// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {Test, Vm} from "forge-std/Test.sol";

contract BaseFixture is Test {

  function setUp() public virtual {
    // Protocol
    vm.label(address(0x17253175f447ca4B560a87a3F39591DFC7A021e3), "Holograph");
    vm.label(address(0x0af817Df693A292a4b8b9ACC698199333eB0DD9e), "HolographBridge");
    vm.label(address(0x53D2B46b341385bC7e022667Eb1860505073D43a), "HolographBridgeProxy");
    vm.label(address(0xa574B1A37c9235d19D942DD4393f728d2a646FDe), "HolographFactory");
    vm.label(address(0xcE2cDFDF0b9D45F8Bd2D3CCa4033527301903FDe), "HolographFactoryProxy");
    vm.label(address(0x0d173B3F4Da8e50333734F36E40c5f475874A7b3), "HolographOperator");
    vm.label(address(0xABc5a4C81D3033cf920b982E75D1080b91AA0EF9), "HolographOperatorProxy");
    vm.label(address(0x1052ae1742fc6878010a31aA53671fEF7D51bf65), "HolographRegistry");
    vm.label(address(0xB47C0E0170306583AA979bF30c0407e2bFE234b2), "HolographRegistryProxy");
    vm.label(address(0x76c4fC0627405741Db0959E66d64c0ECeAceDC94), "HolographTreasury");
    vm.label(address(0x65115A3Be2Aa1F267ccD7499e720088060c7ccd2), "HolographTreasuryProxy");
    vm.label(address(0x67F6394693bd2B46BBE87627F0E581faD80C7B57), "HolographInterfaces");
    vm.label(address(0xbF8f7474D7aCbb87E270FEDA9A5CBB7f766887E3), "HolographRoyalties");

    // Registered tokens
    vm.label(address(0x3337B6e8eF94D36D21406c75Fe8d88E74381c071), "HolographERC721");
    vm.label(address(0x219f9866CE1D32e43130c1B6Cf3818923B5912F4), "CountdownERC721 implementation");

    // Wallets
    vm.label(address(0xdf5295149F367b1FBFD595bdA578BAd22e59f504), "DeployerAddress");
  }
}
